from flask import Flask, request, jsonify, render_template
import ast
import uuid
import os
from dotenv import load_dotenv
import inspect
from groq import Groq
from langchain_anthropic import ChatAnthropic
from langchain.schema import HumanMessage, SystemMessage

app = Flask(__name__)
load_dotenv()

# Store user code and parsed functions
code_store = {}

"""
# Initialize Groq client
llm = ChatAnthropic(
    model="claude-3-opus-20240229",  # You can also try claude-3-sonnet-20240229
    temperature=0,
    anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
    max_tokens=2000)"""

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

        # Prepare the comprehensive prompt for Groq
        prompt = f"""
You are a Python code transformation expert. Your task is to analyze the provided code and transform it to work with frontend inputs.

Complete code to analyze:
```python
{complete_code}
```

Your task:
1. **Identify the main function** in the code (the last function defined)
2. **Find ALL inputs** the function needs:
   - input() calls with prompts
   - Function calls that might need parameters (like get_discount(), get_user_data(), etc.)
   - Any external data the function depends on
3. **Transform the function** to:
   - Accept all required inputs as function parameters
   - Remove all input() calls and replace with parameters
   - Convert print() statements to return statements (use f-strings for formatted output)
   - Handle function calls by converting them to parameters
4. **Determine input types**:
   - If wrapped in int(): python_type = "int", type = "number"
   - If wrapped in float(): python_type = "float", type = "number"  
   - Otherwise: python_type = "str", type = "text"
5. **Extract meaningful descriptions** from input prompts

**Example transformation:**
Input code:
```python
def calculate_discounted_price():
    price = float(input("Enter original price: "))
    discount = get_discount()
    final_price = price - (price * discount / 100)
    print("Final price after discount:", final_price)
```

Output:
```json
{{
  "full_code": "def calculate_discounted_price(price, discount):\n    final_price = price - (price * discount / 100)\n    return f\"Final price after discount: {{final_price}}\"",
  "inputs": [
    {{"name": "price", "type": "number", "description": "Enter original price:", "python_type": "float"}},
    {{"name": "discount", "type": "number", "description": "Discount percentage", "python_type": "float"}}
  ]
}}
```

**Important rules:**
- Always return valid JSON only
- Convert ALL input() calls to parameters
- Convert ALL function calls that seem like data inputs to parameters
- Replace print() with return statements
- Use meaningful parameter names
- Preserve the original function logic
- If input prompt exists, use it as description
- If no prompt, create a meaningful description

Respond with ONLY valid JSON in the exact format shown above.
        """
        
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a coding assistant that analyzes Python code and converts it to work with frontend inputs. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=2000
        )
 
        """ 
        
         # Send to LLM using LangChain
        messages = [
        SystemMessage(content="You are a Python assistant that outputs ONLY JSON."),
        HumanMessage(content=prompt)]  

        response_text = llm.invoke(messages).content.strip()"""

        # Parse the response
        response_text = response.choices[0].message.content.strip()
        
        # Clean and parse JSON response
        import json
        import re

        print(f"Raw response from LLM:\n {repr(response_text)}")
        
        # Remove markdown code block markers
        response_text = re.sub(r'```json\s*|\s*```', '', response_text)
        response_text = response_text.strip()
        
        print(f"After removing markdown:\n {repr(response_text)}")
        
        # Fix JSON formatting - escape newlines within string values
        def fix_json_newlines(text):
            # This regex finds string values in JSON and escapes newlines within them
            def replace_newlines_in_strings(match):
                string_content = match.group(1)
                # Escape newlines and quotes within the string
                escaped_content = string_content.replace('\n', '\\n').replace('"', '\\"')
                return f'"{escaped_content}"'
            
            # Pattern to match JSON string values (content between quotes)
            pattern = r'"([^"]*(?:\n[^"]*)*)"'
            return re.sub(pattern, replace_newlines_in_strings, text)
        
        response_text = fix_json_newlines(response_text)
        
        print(f"After fixing newlines:\n {repr(response_text)}")
        
        try:
            result = json.loads(response_text)
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}")
            # Try a different approach - use ast.literal_eval or manual parsing
            try:
                # Alternative: try to parse it manually by extracting the components
                full_code_match = re.search(r'"full_code":\s*"([^"]*(?:\\.[^"]*)*)"', response_text, re.DOTALL)
                inputs_match = re.search(r'"inputs":\s*(\[.*?\])', response_text, re.DOTALL)
                
                if full_code_match and inputs_match:
                    full_code = full_code_match.group(1).replace('\\n', '\n').replace('\\"', '"')
                    inputs_json = inputs_match.group(1)
                    inputs = json.loads(inputs_json)
                    
                    result = {
                        "full_code": full_code,
                        "inputs": inputs
                    }
                else:
                    raise ValueError("Could not extract components from response")
                    
            except Exception as e2:
                print(f"Manual parsing also failed: {e2}")
                raise ValueError("Could not parse LLM response as JSON")

        # Validate response structure
        if not isinstance(result, dict) or "full_code" not in result or "inputs" not in result:
            raise ValueError("Invalid response structure from LLM")

        if not isinstance(result["inputs"], list):
            raise ValueError("Inputs must be a list")
        print(result)
        return result

    except Exception as e:
        print(f"Error in LLM response: {str(e)}")
        
        # Minimal fallback - just return the original function with a generic input
        return {
            "full_code": function_code,
            "inputs": [
                {"name": "input_1", "type": "text", "description": "Input parameter", "python_type": "str"}
            ]
        }
@app.route("/")
def index():
    return render_template("try.html")

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
    try:
        # Get the full_code and input metadata
        full_code = request.form.get("full_code", "")
        inputs_metadata = request.form.get("inputs_metadata", "[]")  # JSON string of input types
        
        if not full_code:
            return jsonify({"error": "No code provided"}), 400
            
        print("Debug: Received full_code:", full_code)
        print("Debug: Raw form data:", dict(request.form))
        
        # Parse inputs metadata to get type information
        import json
        try:
            inputs_info = json.loads(inputs_metadata) if inputs_metadata != "[]" else []
        except json.JSONDecodeError:
            inputs_info = []
        
        print("Debug: Inputs metadata:", inputs_info)
        
        # Create a mapping of input names to their types
        input_type_map = {info["name"]: info["python_type"] for info in inputs_info}
        print("Debug: Input type mapping:", input_type_map)
        
        # Collect all inputs from form data (excluding metadata fields)
        raw_inputs = {}
        for key, value in request.form.items():
            if key not in ["full_code", "inputs_metadata"]:
                raw_inputs[key] = value
        
        print("Debug: Raw inputs from form:", raw_inputs)
        
        # Handle uploaded files
        for file_key in request.files:
            file = request.files[file_key]
            if file.filename:  # Only process if file was actually uploaded
                import os
                os.makedirs("/tmp", exist_ok=True)
                path = f"/tmp/{file.filename}"
                file.save(path)
                raw_inputs[file_key] = path
                print(f"Debug: Saved file {file.filename} to {path}")
        
        # Convert input types based on metadata
        processed_inputs = {}
        for key, value in raw_inputs.items():
            try:
                if key in input_type_map:
                    python_type = input_type_map[key]
                    if python_type == "float":
                        processed_inputs[key] = float(value)
                    elif python_type == "int":
                        processed_inputs[key] = int(value)
                    elif python_type == "bool":
                        processed_inputs[key] = str(value).lower() in ['true', '1', 'yes', 'on']
                    else:  # str or unknown type
                        processed_inputs[key] = str(value)
                else:
                    # Default to string if no type info available
                    processed_inputs[key] = str(value)
                    
                print(f"Debug: Converted {key}: {value} -> {processed_inputs[key]} ({type(processed_inputs[key])})")
                
            except (ValueError, TypeError) as e:
                print(f"Debug: Type conversion failed for {key}: {str(e)}")
                return jsonify({"error": f"Invalid {input_type_map.get(key, 'string')} format for '{key}': {value}"}), 400
        
        print("Debug: Final processed inputs:", processed_inputs)
        
        # Execute the code
        local_env = {}
        try:
            exec(full_code, local_env)
        except Exception as e:
            print(f"Debug: Code execution failed: {str(e)}")
            return jsonify({"error": f"Code execution failed: {str(e)}"}), 400
        
        # Find the target function (first callable non-builtin function)
        target_func = None
        for name, obj in local_env.items():
            if callable(obj) and not name.startswith("__") and hasattr(obj, '__name__'):
                target_func = obj
                break
        
        if not target_func:
            return jsonify({"error": "No executable function found in the code"}), 400
        
        print(f"Debug: Found target function: {target_func.__name__}")
        
        # Get function signature
        import inspect
        try:
            sig = inspect.signature(target_func)
            expected_params = list(sig.parameters.keys())
            print(f"Debug: Function expects parameters: {expected_params}")
        except Exception as e:
            print(f"Debug: Could not get function signature: {str(e)}")
            expected_params = []
        
        # Prepare arguments for function call
        if expected_params:
            # Filter inputs to match expected parameters
            function_args = {}
            for param in expected_params:
                if param in processed_inputs:
                    function_args[param] = processed_inputs[param]
                else:
                    print(f"Debug: Warning - Missing parameter: {param}")
                    # Try to provide a reasonable default
                    param_info = sig.parameters[param]
                    if param_info.default != inspect.Parameter.empty:
                        continue  # Parameter has default value
                    else:
                        return jsonify({"error": f"Missing required parameter: {param}"}), 400
            
            print(f"Debug: Calling function with args: {function_args}")
            result = target_func(**function_args)
        else:
            # Function takes no parameters
            print("Debug: Calling function with no parameters")
            result = target_func()
        
        print(f"Debug: Function returned: {result} (type: {type(result)})")
        
        # Handle different return types
        if result is None:
            return jsonify({"result": "Function completed successfully (no return value)"})
        elif isinstance(result, (str, int, float, bool, list, dict)):
            return jsonify({"result": result})
        else:
            # Convert complex objects to string representation
            return jsonify({"result": str(result)})
            
    except Exception as e:
        print(f"Debug: Unexpected error: {str(e)}")
        import traceback
        print("Debug: Full traceback:", traceback.format_exc())
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500
    
@app.route("/test", methods=["POST"])
def test_function():
    return render_template("test.html")

if __name__ == "__main__":
    app.run(debug=True)
