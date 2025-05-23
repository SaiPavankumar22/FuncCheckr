from flask import Flask, request, jsonify, render_template
import ast
import uuid
import os
import inspect

app = Flask(__name__)

# Store user code and parsed functions
code_store = {}

# 🔧 Simulated LLM output
def simulate_llm_response(function_code):
    # You should integrate Groq or OpenAI here

    prompt = f"""
    You are a coding assistant. Analyze the following function.

    - Provide the required imports
    - List required inputs in this format: 
    [{{"name": "input1", "type": "text/image/number"}}]

    Function code:
    ```python
    {function_code}
    """

    return {
        "full_code": f"import os\n\n{function_code}",
        "inputs": [
            {"name": "name", "type": "text"},
            #{"name": "image", "type": "image"}
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
