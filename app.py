from flask import Flask, request, jsonify, render_template
import ast
import uuid
import os
from dotenv import load_dotenv
import inspect
from groq import Groq

app = Flask(__name__)
load_dotenv()
# Store user code and parsed functions
code_store = {}

# Initialize Groq client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def simulate_llm_response(function_code):
    try:
        # Prepare the prompt for Groq
        prompt = f"""
        You are a coding assistant. Analyze the following function.

        - Provide the required imports
        - List required inputs in this format: 
        [{{"name": "input1", "type": "text/image/number"}}]

        Function code:
        ```python
        {function_code}
        ```

        Respond in JSON format with two fields:
        1. "full_code": The complete code with imports
        2. "inputs": List of required inputs in the specified format
        """

        # Call Groq API
        response = client.chat.completions.create(
            model="mixtral-8x7b-32768",  # Using Mixtral model for better code understanding
            messages=[
                {"role": "system", "content": "You are a coding assistant that analyzes Python functions and returns structured JSON responses."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,  # Low temperature for more deterministic responses
            max_tokens=1000
        )

        # Parse the response
        response_text = response.choices[0].message.content
        
        # Extract JSON from the response
        import json
        try:
            # Try to parse the response as JSON directly
            result = json.loads(response_text)
        except json.JSONDecodeError:
            # If direct parsing fails, try to extract JSON from the text
            import re
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
            else:
                raise ValueError("Could not parse Groq response as JSON")

        return result

    except Exception as e:
        # Fallback to a basic response if Groq fails
        return {
            "full_code": f"import os\n\n{function_code}",
            "inputs": [
                {"name": "name", "type": "text"}
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
        tree = ast.parse(code)
        functions = {}
        names = []

        for node in tree.body:
            if isinstance(node, ast.FunctionDef):
                name = node.name
                names.append(name)
                functions[name] = ast.unparse(node)

        code_store[uid] = {
            "full_code": code,
            "functions": functions
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

    # 🔮 Call your LLM API here
    analysis = simulate_llm_response(func_code)

    return jsonify(analysis)

@app.route("/test", methods=["POST"])
def test_function():
    full_code = request.form.get("full_code", "")
    inputs = dict(request.form)
    inputs.pop("full_code", None)

    # Save uploaded files
    for file_key in request.files:
        file = request.files[file_key]
        path = f"/tmp/{file.filename}"
        file.save(path)
        inputs[file_key] = path  # Send filepath as string

    try:
        local_env = {}
        exec(full_code, local_env)

        # Find first callable non-builtin function
        target_func = next(v for k, v in local_env.items()
                           if callable(v) and not k.startswith("__"))

        # Get the parameter names the function expects
        expected_args = inspect.signature(target_func).parameters.keys()

        # Filter the inputs to only include what the function needs
        filtered_inputs = {k: v for k, v in inputs.items() if k in expected_args}

        # Call the function with filtered inputs
        result = target_func(**filtered_inputs)

        return jsonify({"result": result})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
