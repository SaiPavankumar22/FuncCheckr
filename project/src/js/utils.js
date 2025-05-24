/**
 * Utility functions for FuncCheckr
 */

// Toast notification system
const toastSystem = {
  container: null,
  
  init() {
    this.container = document.getElementById('toast-container');
  },
  
  show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    this.container.appendChild(toast);
    
    // Auto remove after duration
    setTimeout(() => {
      toast.style.animation = 'fadeOut var(--transition)';
      toast.addEventListener('animationend', () => {
        toast.remove();
      });
    }, duration);
  }
};

// Function to detect function bounds in code
function detectFunctionBounds(code, functionName, language) {
  // Different regex patterns based on language
  let pattern;
  switch (language) {
    case 'python':
      pattern = new RegExp(`def\\s+${functionName}\\s*\\([^)]*\\)\\s*:`, 'g');
      break;
    case 'javascript':
      pattern = new RegExp(`function\\s+${functionName}\\s*\\([^)]*\\)|const\\s+${functionName}\\s*=\\s*\\([^)]*\\)\\s*=>|const\\s+${functionName}\\s*=\\s*function\\s*\\([^)]*\\)`, 'g');
      break;
    case 'java':
      pattern = new RegExp(`(public|private|protected|)\\s+\\w+\\s+${functionName}\\s*\\([^)]*\\)`, 'g');
      break;
    case 'cpp':
      pattern = new RegExp(`\\w+\\s+${functionName}\\s*\\([^)]*\\)`, 'g');
      break;
    default:
      pattern = new RegExp(`function\\s+${functionName}\\s*\\(|def\\s+${functionName}\\s*\\(`, 'g');
  }
  
  const lines = code.split('\n');
  let startLine = -1;
  let endLine = -1;
  
  // Find the start line
  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i])) {
      startLine = i;
      break;
    }
  }
  
  if (startLine === -1) return null;
  
  // Find the end line based on indentation (for Python) or braces (for other languages)
  if (language === 'python') {
    const baseIndent = lines[startLine].match(/^\s*/)[0].length;
    endLine = startLine;
    
    for (let i = startLine + 1; i < lines.length; i++) {
      if (lines[i].trim() === '' || lines[i].match(/^\s*/)[0].length > baseIndent) {
        endLine = i;
      } else {
        break;
      }
    }
  } else {
    // For braces-based languages, count opening and closing braces
    let braceCount = 0;
    let foundFirstBrace = false;
    
    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];
      
      // Count opening braces
      for (let j = 0; j < line.length; j++) {
        if (line[j] === '{') {
          braceCount++;
          foundFirstBrace = true;
        } else if (line[j] === '}') {
          braceCount--;
        }
      }
      
      if (foundFirstBrace && braceCount === 0) {
        endLine = i;
        break;
      }
    }
    
    // If we couldn't find the end with braces, use a simpler approach
    if (endLine === -1) {
      endLine = startLine + 10; // Arbitrary number of lines
    }
  }
  
  return { startLine, endLine };
}

// Function to parse parameters from function definition
function parseParameters(functionDef, language) {
  let paramString = '';
  const params = [];
  
  switch (language) {
    case 'python':
      // Extract parameter string from Python function definition
      const pythonMatch = functionDef.match(/def\s+\w+\s*\((.*?)\)/);
      if (pythonMatch) paramString = pythonMatch[1];
      
      // Parse individual parameters
      const pythonParams = paramString.split(',').map(p => p.trim());
      pythonParams.forEach(param => {
        if (param) {
          const [name, type] = param.split(':').map(p => p.trim());
          params.push({
            name,
            type: type ? type.replace(/\s*=\s*.+$/, '') : 'any'
          });
        }
      });
      break;
      
    case 'javascript':
      // Extract parameter string from JavaScript function definition
      const jsMatch = functionDef.match(/function\s+\w+\s*\((.*?)\)|const\s+\w+\s*=\s*(?:function\s*)?\((.*?)\)|const\s+\w+\s*=\s*\((.*?)\)\s*=>/);
      if (jsMatch) paramString = jsMatch[1] || jsMatch[2] || jsMatch[3];
      
      // Parse individual parameters
      const jsParams = paramString.split(',').map(p => p.trim());
      jsParams.forEach(param => {
        if (param) {
          // Handle destructuring and other JS parameter patterns
          const paramName = param.replace(/\s*=\s*.+$/, '');
          params.push({
            name: paramName,
            type: 'any'
          });
        }
      });
      break;
      
    case 'java':
    case 'cpp':
      // Extract parameter string from Java/C++ function definition
      const match = functionDef.match(/\w+\s+\w+\s*\((.*?)\)/);
      if (match) paramString = match[1];
      
      // Parse individual parameters
      const cParams = paramString.split(',').map(p => p.trim());
      cParams.forEach(param => {
        if (param) {
          const parts = param.split(/\s+/);
          if (parts.length >= 2) {
            params.push({
              name: parts[parts.length - 1],
              type: parts.slice(0, parts.length - 1).join(' ')
            });
          }
        }
      });
      break;
  }
  
  return params;
}