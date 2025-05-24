# FuncCheckr

FuncCheckr is a simple web application that allows you to test individual functions from your Python code directly through a web interface.

It uses a Flask backend (`app.py`) to analyze your code, extract functions, and run tests. The frontend (`templates/try.html`) provides a user interface with a code editor and controls for selecting and testing functions.

## Components

*   **`app.py`**: The Flask backend. This handles:
    *   Receiving code input.
    *   Extracting function names and code using the `ast` module.
    *   Using an AI model (Groq) to analyze functions, identify inputs, and transform the function code for testing.
    *   Executing the transformed functions with provided inputs.
    *   Serving the frontend HTML file.

*   **`templates/try.html`**: The frontend HTML file. This includes:
    *   A Monaco Editor for writing and editing code.
    *   A dropdown to select detected functions.
    *   Dynamically generated input fields based on the function analysis.
    *   Buttons to analyze code and run tests.
    *   An output area to display results or errors.

## Setup and Running

1.  **Prerequisites**:
    *   Python 3.7+
    *   `pip` (Python package installer)
    *   A Groq API Key (you'll need to sign up on the Groq website).

2.  **Clone the repository** (if applicable, otherwise navigate to your project directory).

3.  **Install Dependencies**:
    Navigate to the project directory in your terminal and run:
    ```bash
    pip install Flask groq python-dotenv
    ```
    *(Note: The code also shows imports for `langchain_anthropic` and `ChatAnthropic`, but the primary implementation uses `groq`. Install `langchain-anthropic` and have an `ANTHROPIC_API_KEY` if you intend to use the alternative LLM implementation by uncommenting the relevant code in `app.py`.)*

4.  **Set up Environment Variables**:
    Create a file named `.env` in the same directory as `app.py`. Add your Groq API key:
    ```dotenv
    GROQ_API_KEY=your_groq_api_key_here
    ```
    Replace `your_groq_api_key_here` with your actual key.

5.  **Run the Application**:
    In your terminal, run:
    ```bash
    python app.py
    ```

6.  **Access the Application**:
    Open your web browser and go to `http://127.0.0.1:5000/`.

## Usage

1.  Write or paste your Python code into the code editor on the left.
2.  Select the desired language from the dropdown in the header.
3.  Click the "Analyze Code" button. The application will process your code and populate the function dropdown in the sidebar.
4.  Select a function from the dropdown. The application will analyze the function to determine its required inputs.
5.  Input fields will appear dynamically based on the function's requirements.
6.  Fill in the input fields.
7.  Click the "Test Function" button. The backend will run the selected function with your provided inputs.
8.  The output of the function execution will appear in the "Output" area at the bottom of the sidebar.

You can click "Clear" to reset the editor and application state. 