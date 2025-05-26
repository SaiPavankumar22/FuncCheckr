# FuncCheckr 🚀

<div align="center">
  <img src="https://img.shields.io/badge/Python-3.7+-blue.svg" alt="Python 3.7+">
  <img src="https://img.shields.io/badge/Flask-2.0+-lightgrey.svg" alt="Flask 2.0+">
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License: MIT">
</div>

## 🌟 Overview

FuncCheckr is a revolutionary alternative to traditional API testing tools like Postman and Swagger. While these tools require separate installations, browser tabs, or complex setups, FuncCheckr brings the power of API testing directly into your development environment.

### Why Choose FuncCheckr Over Traditional Tools?

#### 🚀 Seamless Development Experience
- **No Context Switching**: Test your functions without leaving your IDE
- **Integrated Workflow**: Eliminates the need to switch between Postman/Swagger and your code editor
- **Real-time Testing**: Test functions as you write them, not after deployment

#### 💪 Developer-First Features
- **Function-Level Testing**: Test individual functions, not just endpoints
- **Smart Parameter Detection**: Automatically identifies and generates appropriate input fields
- **Instant Feedback**: Get immediate results without setting up complex test environments
- **Code-First Approach**: Works directly with your source code, not just HTTP endpoints

#### 🎯 Perfect for Modern Development
- **Microservices Testing**: Test individual service functions without full deployment
- **API Development**: Validate API endpoints during development
- **Function-as-a-Service**: Ideal for testing serverless functions and cloud functions
- **Rapid Prototyping**: Quickly test and iterate on function logic

#### 🔄 IDE Integration Ready
- **VS Code Extension**: Coming soon as a native VS Code extension
- **Cursor Integration**: Seamless integration with Cursor IDE
- **Tree AI Support**: Compatible with Tree AI development environment
- **Windsurd Integration**: Works within the Windsurd IDE ecosystem

### Use Cases

1. **API Development**
   - Test endpoints during development
   - Validate request/response handling
   - Debug API logic in real-time

2. **Microservices**
   - Test individual service functions
   - Validate inter-service communication
   - Debug service-specific logic

3. **Serverless Development**
   - Test cloud functions locally
   - Validate function triggers
   - Debug serverless logic

4. **Rapid Prototyping**
   - Quick function validation
   - Iterative development
   - Immediate feedback loop

### 🎯 Key Features

- **IDE Integration Ready**: Designed to be easily converted into extensions for popular IDEs like VS Code, Cursor, Tree AI, and Windsurd
- **Real-time Function Testing**: Test individual functions directly from your code editor
- **Smart Input Analysis**: Automatically detects and generates appropriate input fields based on function parameters
- **Multi-language Support**: Currently supports Python, with plans to expand to JavaScript, C++, and Java
- **AI-Powered Analysis**: Utilizes Groq's AI model to intelligently analyze and transform functions for testing
- **Modern UI**: Clean, intuitive interface with syntax highlighting and real-time feedback

## 🏗️ Architecture

### Backend (`app.py`)
- **Flask Server**: Handles all API requests and code execution
- **Code Analysis**: Uses Python's `ast` module for precise code parsing
- **AI Integration**: Leverages Groq's AI model for intelligent function analysis
- **Function Execution**: Safely executes transformed functions with provided inputs
- **Error Handling**: Comprehensive error catching and reporting

### Frontend (`templates/try.html`)
- **Monaco Editor**: Professional-grade code editor with syntax highlighting
- **Dynamic UI**: Responsive interface that adapts to function requirements
- **Real-time Feedback**: Immediate results and error reporting
- **Modern Design**: Clean, dark-themed interface for reduced eye strain

## 🚀 Getting Started

### Prerequisites
- Python 3.7 or higher
- `pip` package manager
- Groq API Key (sign up at [Groq's website](https://groq.com))

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/funccheckr.git
   cd funccheckr
   ```

2. **Install Dependencies**
   ```bash
   pip install Flask groq python-dotenv
   ```

3. **Configure Environment**
   Create a `.env` file in the project root:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   ```

4. **Run the Application**
   ```bash
   python app.py
   ```

5. **Access the Application**
   Open your browser and navigate to `http://127.0.0.1:5000`

## 💡 Usage Guide

1. **Write Your Code**
   - Enter your code in the Monaco Editor
   - Select your programming language from the dropdown

2. **Analyze Functions**
   - Click "Analyze Code" to detect functions
   - Select a function from the dropdown menu

3. **Test Functions**
   - Input fields will be generated based on function parameters
   - Fill in the required inputs
   - Click "Test Function" to execute
   - View results in the output area

## 🔮 Future Development

- **IDE Extension Development**: Converting to VS Code, Cursor, and other IDE extensions
- **Additional Language Support**: Expanding beyond Python to JavaScript, C++, Java, and more
- **Advanced Testing Features**: Adding support for unit tests and test cases
- **Collaboration Features**: Real-time collaboration and sharing capabilities
- **Custom Themes**: Additional UI themes and customization options

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Monaco Editor](https://microsoft.github.io/monaco-editor/) for the code editor
- [Groq](https://groq.com) for AI capabilities
- [Flask](https://flask.palletsprojects.com/) for the web framework

---

<div align="center">
  Made with ❤️ by DSPK
</div> 