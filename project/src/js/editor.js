/**
 * Editor configuration and handling
 */

// Monaco editor instance
let editor = null;
let currentLanguage = 'python';
let functionDecorations = [];

// Initialize the Monaco editor
function initEditor() {
  require.config({ paths: { vs: 'https://unpkg.com/monaco-editor@0.33.0/min/vs' } });
  
  require(['vs/editor/editor.main'], function() {
    // Configure Monaco editor theme
    monaco.editor.defineTheme('funccheckr-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'C586C0' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'function', foreground: 'DCDCAA' },
        { token: 'type', foreground: '4EC9B0' }
      ],
      colors: {
        'editor.background': '#1e1e2e',
        'editor.foreground': '#cdd6f4',
        'editorLineNumber.foreground': '#7f849c',
        'editorLineNumber.activeForeground': '#a6adc8',
        'editor.selectionBackground': '#45475a',
        'editor.inactiveSelectionBackground': '#313244',
        'editor.lineHighlightBackground': '#313244',
        'editorCursor.foreground': '#f5e0dc',
        'editorWhitespace.foreground': '#313244',
        'editorIndentGuide.background': '#313244',
        'editorIndentGuide.activeBackground': '#45475a'
      }
    });
    
    // Create the editor
    editor = monaco.editor.create(document.getElementById('editor-container'), {
      value: getDefaultCode(currentLanguage),
      language: currentLanguage,
      theme: 'funccheckr-dark',
      automaticLayout: true,
      fontSize: 14,
      fontFamily: 'JetBrains Mono, monospace',
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      minimap: { enabled: true },
      renderWhitespace: 'selection',
      tabSize: 2,
      wordWrap: 'on',
      suggest: { snippetsPreventQuickSuggestions: false }
    });
    
    // Initialize with default code
    editor.updateOptions({
      lineNumbersMinChars: 3,
      glyphMargin: true
    });
    
    // Add editor change listener
    editor.onDidChangeModelContent(() => {
      // Clear function highlights when content changes
      clearFunctionHighlights();
    });
  });
}

// Get default code for different languages
function getDefaultCode(language) {
  switch (language) {
    case 'python':
      return 'def greet(name):\n    return f"Hello, {name}!"\n\ndef calculate_sum(a, b):\n    return a + b';
    case 'javascript':
      return 'function greet(name) {\n  return `Hello, ${name}!`;\n}\n\nfunction calculateSum(a, b) {\n  return a + b;\n}';
    case 'java':
      return 'public class Main {\n  public static String greet(String name) {\n    return "Hello, " + name + "!";\n  }\n\n  public static int calculateSum(int a, int b) {\n    return a + b;\n  }\n}';
    case 'cpp':
      return '#include <string>\n#include <iostream>\n\nstd::string greet(std::string name) {\n  return "Hello, " + name + "!";\n}\n\nint calculateSum(int a, int b) {\n  return a + b;\n}';
    default:
      return 'def greet(name):\n    return f"Hello, {name}!"';
  }
}

// Change editor language
function changeEditorLanguage(language) {
  currentLanguage = language;
  monaco.editor.setModelLanguage(editor.getModel(), language);
  editor.setValue(getDefaultCode(language));
  clearFunctionHighlights();
}

// Highlight a function in the editor
function highlightFunction(functionName) {
  clearFunctionHighlights();
  
  const code = editor.getValue();
  const bounds = detectFunctionBounds(code, functionName, currentLanguage);
  
  if (!bounds) {
    toastSystem.show(`Could not find function "${functionName}"`, 'error');
    return false;
  }
  
  // Create decorations for the function
  const startLineNumber = bounds.startLine + 1;
  const endLineNumber = bounds.endLine + 1;
  
  const decorations = [{
    range: new monaco.Range(startLineNumber, 1, endLineNumber, 1),
    options: {
      isWholeLine: true,
      className: 'highlighted-function',
      glyphMarginClassName: 'line-decoration'
    }
  }];
  
  functionDecorations = editor.deltaDecorations([], decorations);
  
  // Scroll to the function
  editor.revealLineInCenter(startLineNumber);
  
  return true;
}

// Clear function highlights
function clearFunctionHighlights() {
  if (functionDecorations.length > 0) {
    functionDecorations = editor.deltaDecorations(functionDecorations, []);
  }
}

// Get function definition
function getFunctionDefinition(functionName) {
  const code = editor.getValue();
  const bounds = detectFunctionBounds(code, functionName, currentLanguage);
  
  if (!bounds) return null;
  
  const lines = code.split('\n');
  const functionLines = lines.slice(bounds.startLine, bounds.endLine + 1);
  return functionLines.join('\n');
}

// Get editor content
function getEditorContent() {
  return editor.getValue();
}