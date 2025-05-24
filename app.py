from flask import Flask, request, jsonify, render_template
import ast
import uuid
import os
from dotenv import load_dotenv
import inspect
from groq import Groq
import math

app = Flask(__name__)
load_dotenv()

# Store user code and parsed functions
code_store = {}

# Initialize Groq client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def extract_code_elements(code):
    tree = ast.parse(code)
    elements = {
        "imports": [],
        "global_vars": [],
        "functions": {},
        "other_code": []
    }
    
    for node in tree.body:
        if isinstance(node, ast.Import):
            elements["imports"].append(ast.unparse(node))
        elif isinstance(node, ast.ImportFrom):
            elements["imports"].append(ast.unparse(node))
        elif isinstance(node, ast.FunctionDef):
            elements["functions"][node.name] = ast.unparse(node)
        elif isinstance(node, ast.Assign):
            elements["global_vars"].append(ast.unparse(node))
        else:
            elements["other_code"].append(ast.unparse(node))
    
    return elements

def simulate_llm_response(function_code, full_code_elements):
    try:
        # Combine all code elements
        complete_code = "\n".join([
            *full_code_elements["imports"],
            *full_code_elements["global_vars"],
            *full_code_elements["other_code"],
            function_code
        ])

        # Parse the code to determine input types
        tree = ast.parse(function_code)
        input_types = []
        
        # Find all input() calls and their types
        for node in ast.walk(tree):
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == 'input':
                # Look at the parent node to determine type
                parent = getattr(node, 'parent', None)
                if parent and isinstance(parent, ast.Call):
                    if isinstance(parent.func, ast.Name):
                        if parent.func.id == 'float':
                            input_types.append('float')
                        elif parent.func.id == 'int':
                            input_types.append('int')
                        else:
                            input_types.append('str')
                    else:
                        input_types.append('str')
                else:
                    input_types.append('str')

        # Prepare the prompt for Groq
        prompt = f"""
        You are a coding assistant. Analyze the following code and modify it to work with frontend inputs.

        Original code:
        ```python
        {complete_code}
        ```

        Please:
        1. Identify ALL input statements in the code (including input(), function calls, and request parameters)
        2. Convert any console input() statements to function parameters
        3. List ALL required inputs in this format:
        [{{"name": "input_name", "type": "text/number/image", "description": "what this input is for", "python_type": "{input_types[0] if input_types else 'str'}"}}]
        4. Modify the code to accept these inputs as parameters
        5. Handle any function calls within the code as additional inputs
        6. IMPORTANT: Convert the function to return the result instead of printing it

        IMPORTANT: Respond with ONLY a valid JSON object in this exact format:
        {{
            "full_code": "The modified code that accepts frontend inputs",
            "inputs": [
                {{"name": "input_name", "type": "text/number/image", "description": "description", "python_type": "{input_types[0] if input_types else 'str'}"}}
            ]
        }}

        Example: If code has `num = float(input("Enter a number: "))`, convert it to a function parameter with python_type: "float".
        """

        # Call Groq API
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a coding assistant that analyzes Python code and converts it to work with frontend inputs. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=2000
        )

        # Parse the response
        response_text = response.choices[0].message.content.strip()
        
        # Clean the response text to ensure it's valid JSON
        import json
        import re

        # Remove any markdown code block markers
        response_text = re.sub(r'```json\s*|\s*```', '', response_text)
        
        # Remove any leading/trailing whitespace and newlines
        response_text = response_text.strip()
        
        try:
            # Try to parse the response as JSON directly
            result = json.loads(response_text)
        except json.JSONDecodeError as e:
            print(f"Initial JSON parsing failed: {str(e)}")
            print(f"Raw response: {response_text}")
            
            # Try to extract JSON using regex
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                try:
                    result = json.loads(json_match.group())
                except json.JSONDecodeError as e2:
                    print(f"Regex JSON parsing failed: {str(e2)}")
                    raise ValueError("Could not parse Groq response as JSON")
            else:
                raise ValueError("No JSON object found in response")

        # Validate the result structure
        if not isinstance(result, dict) or "full_code" not in result or "inputs" not in result:
            raise ValueError("Invalid response structure")

        if not isinstance(result["inputs"], list):
            raise ValueError("Inputs must be a list")

        # Update input types based on our analysis
        for i, input_type in enumerate(input_types):
            if i < len(result["inputs"]):
                result["inputs"][i]["python_type"] = input_type

        return result

    except Exception as e:
        print(f"Error in LLM response: {str(e)}")
        
        # Create a dynamic fallback response based on the input code
        try:
            # Parse the function code to identify inputs
            tree = ast.parse(function_code)
            inputs = []
            modified_code = function_code

            # Find all input() calls and convert them to parameters
            for node in ast.walk(tree):
                if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == 'input':
                    # Get the input prompt if it exists
                    prompt = ""
                    if node.args and isinstance(node.args[0], ast.Constant):
                        prompt = node.args[0].value
                    
                    # Generate a parameter name based on the prompt or a default
                    param_name = "input_" + str(len(inputs) + 1)
                    if prompt:
                        # Try to extract a meaningful name from the prompt
                        words = prompt.lower().split()
                        if words:
                            # Use the first word that's not a common word
                            common_words = {'enter', 'please', 'input', 'the', 'a', 'an', 'your'}
                            for word in words:
                                if word not in common_words:
                                    param_name = word
                                    break
                    
                    # Determine Python type based on the code context
                    python_type = "str"  # default type
                    parent = getattr(node, 'parent', None)
                    if parent and isinstance(parent, ast.Call):
                        if isinstance(parent.func, ast.Name):
                            if parent.func.id == 'float':
                                python_type = "float"
                            elif parent.func.id == 'int':
                                python_type = "int"
                    
                    # Add to inputs list
                    input_type = "number" if python_type in ["float", "int"] else "text"
                    inputs.append({
                        "name": param_name,
                        "type": input_type,
                        "description": prompt if prompt else f"Input parameter {len(inputs) + 1}",
                        "python_type": python_type
                    })
                    
                    # Replace input() call with parameter
                    modified_code = modified_code.replace(
                        ast.unparse(node),
                        param_name
                    )

            # Convert print statements to return
            modified_code = modified_code.replace("print(", "return f")

            # If no inputs were found, add a default input
            if not inputs:
                inputs.append({
                    "name": "input_1",
                    "type": "text",
                    "description": "Input parameter",
                    "python_type": "str"
                })

            return {
                "full_code": modified_code,
                "inputs": inputs
            }

        except Exception as fallback_error:
            print(f"Fallback processing failed: {str(fallback_error)}")
            # Ultimate fallback if everything fails
            return {
                "full_code": function_code,
                "inputs": [
                    {"name": "input_1", "type": "text", "description": "Input parameter", "python_type": "str"}
                ]
            }

@app.route("/")
def index():
    return render_template("main.html")

@app.route("/code", methods=["POST"])
def extract_functions():
    data = request.get_json()
    code = data.get("code", "")
    uid = str(uuid.uuid4())

    try:
        # Extract all code elements
        code_elements = extract_code_elements(code)
        functions = code_elements["functions"]
        names = list(functions.keys())

        code_store[uid] = {
            "full_code": code,
            "functions": functions,
            "code_elements": code_elements
        }

        return jsonify({"uid": uid, "functionNames": names})

    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/analyze", methods=["POST"])
def analyze_function():
    data = request.json
    uid = data.get("uid")
    func_name = data.get("functionName")

    if uid not in code_store or func_name not in code_store[uid]["functions"]:
        return jsonify({"error": "Function or UID not found"}), 404

    func_code = code_store[uid]["functions"][func_name]
    code_elements = code_store[uid]["code_elements"]

    # Call LLM with both function code and all code elements
    analysis = simulate_llm_response(func_code, code_elements)

    return jsonify(analysis)

@app.route("/test", methods=["POST"])
def test_function():
    full_code = request.form.get("full_code", "")
    inputs = dict(request.form)
    inputs.pop("full_code", None)

    print("Debug: Raw form data:", request.form)  # Debug print
    print("Debug: Received inputs:", inputs)  # Debug print

    # Save uploaded files
    for file_key in request.files:
        file = request.files[file_key]
        path = f"/tmp/{file.filename}"
        file.save(path)
        inputs[file_key] = path  # Send filepath as string

    try:
        # Parse the full_code to determine input types
        tree = ast.parse(full_code)
        input_types = {}
        
        # Find all input() calls and their types
        for node in ast.walk(tree):
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == 'input':
                # Look at the parent node to determine type
                parent = getattr(node, 'parent', None)
                if parent and isinstance(parent, ast.Call):
                    if isinstance(parent.func, ast.Name):
                        if parent.func.id == 'float':
                            input_types[list(inputs.keys())[len(input_types)]] = 'float'
                        elif parent.func.id == 'int':
                            input_types[list(inputs.keys())[len(input_types)]] = 'int'

        print("Debug: Detected input types:", input_types)  # Debug print

        # Convert input types based on the detected types
        for key, value in inputs.items():
            print(f"Debug: Processing input {key} with value {value}")  # Debug print
            if key in input_types:
                python_type = input_types[key]
                try:
                    if python_type == "float":
                        inputs[key] = float(value)
                        print(f"Debug: Converted {key} to float: {inputs[key]}")  # Debug print
                    elif python_type == "int":
                        inputs[key] = int(value)
                        print(f"Debug: Converted {key} to int: {inputs[key]}")  # Debug print
                    elif python_type == "bool":
                        inputs[key] = value.lower() in ['true', '1', 'yes']
                        print(f"Debug: Converted {key} to bool: {inputs[key]}")  # Debug print
                except ValueError as e:
                    print(f"Debug: Type conversion failed for {key}: {str(e)}")  # Debug print
                    return jsonify({"error": f"Invalid {python_type} format for {key}"}), 400

        print("Debug: Final processed inputs:", inputs)  # Debug print

        local_env = {}
        exec(full_code, local_env)

        # Find first callable non-builtin function
        target_func = next(v for k, v in local_env.items()
                           if callable(v) and not k.startswith("__"))

        print("Debug: Found target function:", target_func.__name__)  # Debug print

        # Get the parameter names the function expects
        expected_args = inspect.signature(target_func).parameters.keys()
        print("Debug: Expected arguments:", list(expected_args))  # Debug print

        # Filter the inputs to only include what the function needs
        filtered_inputs = {k: v for k, v in inputs.items() if k in expected_args}
        print("Debug: Filtered inputs for function:", filtered_inputs)  # Debug print

        # Call the function with filtered inputs
        result = target_func(**filtered_inputs)
        print("Debug: Function result:", result)  # Debug print

        return jsonify({"result": result})

    except Exception as e:
        print(f"Debug: Error occurred: {str(e)}")  # Debug print
        import traceback
        print("Debug: Full traceback:", traceback.format_exc())  # Debug print
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
