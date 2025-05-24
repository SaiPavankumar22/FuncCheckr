/**
 * Function handling - submission, analysis, and testing
 */

let uid = '';
let functionList = [];
let currentFunction = '';
let fullCode = '';

// Submit code for analysis
async function submitCode() {
  try {
    const code = getEditorContent();
    
    if (!code.trim()) {
      toastSystem.show('Please enter some code first', 'error');
      return;
    }
    
    // Show loading state
    document.getElementById('submitCodeBtn').disabled = true;
    document.getElementById('submitCodeBtn').textContent = 'Analyzing...';
    
    const res = await fetch('/code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language: currentLanguage })
    });
    
    if (!res.ok) {
      throw new Error('Failed to analyze code');
    }
    
    const data = await res.json();
    uid = data.uid;
    fullCode = code;
    functionList = data.functionNames || [];
    
    // Update function dropdown
    updateFunctionDropdown(functionList);
    
    // Enable analyze button if functions were found
    const analyzeBtn = document.getElementById('analyzeBtn');
    analyzeBtn.disabled = functionList.length === 0;
    
    if (functionList.length > 0) {
      toastSystem.show(`Found ${functionList.length} functions in your code`, 'success');
    } else {
      toastSystem.show('No functions found in your code', 'error');
    }
  } catch (error) {
    console.error('Error submitting code:', error);
    toastSystem.show('Error analyzing code: ' + error.message, 'error');
  } finally {
    // Reset button state
    document.getElementById('submitCodeBtn').disabled = false;
    document.getElementById('submitCodeBtn').textContent = 'Analyze Code';
  }
}

// Update function dropdown with found functions
function updateFunctionDropdown(functions) {
  const dropdown = document.getElementById('functionDropdown');
  dropdown.innerHTML = '';
  dropdown.disabled = functions.length === 0;
  
  if (functions.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No functions available';
    dropdown.appendChild(option);
    return;
  }
  
  functions.forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    dropdown.appendChild(option);
  });
}

// Analyze selected function
async function analyzeFunction() {
  try {
    const funcName = document.getElementById('functionDropdown').value;
    
    if (!funcName) {
      toastSystem.show('Please select a function to analyze', 'error');
      return;
    }
    
    currentFunction = funcName;
    
    // Highlight the function in editor
    const highlighted = highlightFunction(funcName);
    if (!highlighted) return;
    
    // Get function definition
    const functionDef = getFunctionDefinition(funcName);
    if (!functionDef) {
      toastSystem.show(`Could not extract function definition for "${funcName}"`, 'error');
      return;
    }
    
    document.getElementById('analyzeBtn').disabled = true;
    document.getElementById('analyzeBtn').textContent = 'Analyzing...';
    
    // Extract parameters locally (fallback if server doesn't respond)
    const params = parseParameters(functionDef, currentLanguage);
    
    // Call backend for analysis
    const res = await fetch('/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        uid, 
        functionName: funcName,
        language: currentLanguage,
        code: fullCode 
      })
    });
    
    if (!res.ok) {
      throw new Error('Failed to analyze function');
    }
    
    const data = await res.json();
    
    // Use server-provided inputs or fallback to local parsing
    const inputs = data.inputs || params;
    
    // Generate input fields for the function
    generateInputFields(funcName, inputs);
    
    toastSystem.show(`Function "${funcName}" ready for testing`, 'success');
  } catch (error) {
    console.error('Error analyzing function:', error);
    toastSystem.show('Error analyzing function: ' + error.message, 'error');
  } finally {
    document.getElementById('analyzeBtn').disabled = false;
    document.getElementById('analyzeBtn').textContent = 'Test Function';
  }
}

// Generate input fields for function parameters
function generateInputFields(functionName, inputs) {
  const dynamicUI = document.getElementById('dynamic-ui');
  
  // Clear previous fields
  dynamicUI.innerHTML = '';
  
  // Create input container
  const inputContainer = document.createElement('div');
  inputContainer.className = 'input-field';
  inputContainer.id = `input-container-${functionName}`;
  
  // Add header with function name and close button
  const header = document.createElement('div');
  header.className = 'input-field-header';
  
  const title = document.createElement('h3');
  title.textContent = `Test ${functionName}()`;
  
  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-btn';
  closeBtn.innerHTML = '&times;';
  closeBtn.onclick = () => {
    inputContainer.style.animation = 'fadeOut var(--transition)';
    inputContainer.addEventListener('animationend', () => {
      inputContainer.remove();
    });
  };
  
  header.appendChild(title);
  header.appendChild(closeBtn);
  inputContainer.appendChild(header);
  
  // Add input fields for each parameter
  inputs.forEach(input => {
    const inputGroup = document.createElement('div');
    inputGroup.className = 'input-group';
    
    const label = document.createElement('label');
    label.textContent = `${input.name} (${input.type || 'any'})`;
    
    let field;
    if (input.type === 'image') {
      field = document.createElement('input');
      field.type = 'file';
      field.accept = 'image/*';
    } else if (input.type === 'bool' || input.type === 'boolean') {
      field = document.createElement('select');
      const trueOpt = document.createElement('option');
      trueOpt.value = 'true';
      trueOpt.textContent = 'True';
      const falseOpt = document.createElement('option');
      falseOpt.value = 'false';
      falseOpt.textContent = 'False';
      field.appendChild(trueOpt);
      field.appendChild(falseOpt);
    } else if (input.type === 'int' || input.type === 'float' || input.type === 'number') {
      field = document.createElement('input');
      field.type = 'number';
      if (input.type === 'int') {
        field.step = '1';
      } else {
        field.step = 'any';
      }
    } else if (input.type === 'string' || input.type === 'str') {
      field = document.createElement('input');
      field.type = 'text';
    } else {
      field = document.createElement('input');
      field.type = 'text';
    }
    
    field.name = input.name;
    field.id = `input-${functionName}-${input.name}`;
    field.className = 'form-control';
    
    inputGroup.appendChild(label);
    inputGroup.appendChild(field);
    inputContainer.appendChild(inputGroup);
  });
  
  // Add submit button
  const actionDiv = document.createElement('div');
  actionDiv.className = 'input-actions';
  
  const testBtn = document.createElement('button');
  testBtn.className = 'btn primary';
  testBtn.textContent = 'Run Test';
  testBtn.onclick = () => testFunction(functionName, inputs);
  
  actionDiv.appendChild(testBtn);
  inputContainer.appendChild(actionDiv);
  
  // Add to UI
  dynamicUI.appendChild(inputContainer);
  
  // Show the input container with animation
  inputContainer.style.animation = 'fadeIn var(--transition)';
}

// Test the function with provided inputs
async function testFunction(functionName, inputs) {
  try {
    // Collect input values
    const formData = new FormData();
    formData.append('full_code', fullCode);
    formData.append('uid', uid);
    formData.append('functionName', functionName);
    formData.append('language', currentLanguage);
    
    let hasAllInputs = true;
    
    inputs.forEach(input => {
      const field = document.getElementById(`input-${functionName}-${input.name}`);
      if (!field || (field.type !== 'file' && !field.value.trim())) {
        hasAllInputs = false;
        return;
      }
      
      if (input.type === 'image') {
        formData.append(input.name, field.files[0]);
      } else {
        formData.append(input.name, field.value);
      }
    });
    
    if (!hasAllInputs) {
      toastSystem.show('Please fill in all input fields', 'error');
      return;
    }
    
    // Update result area to show loading
    const outputElement = document.getElementById('output');
    outputElement.textContent = 'Running test...';
    outputElement.className = '';
    
    // Send request to test endpoint
    const res = await fetch('/test', {
      method: 'POST',
      body: formData
    });
    
    const data = await res.json();
    
    // Display result
    if (res.ok) {
      outputElement.textContent = typeof data.result === 'object' 
        ? JSON.stringify(data.result, null, 2) 
        : data.result;
      outputElement.className = 'result-success';
      toastSystem.show('Function executed successfully', 'success');
    } else {
      outputElement.textContent = `Error: ${data.error}`;
      outputElement.className = 'result-error';
      toastSystem.show('Error executing function', 'error');
    }
  } catch (error) {
    console.error('Error testing function:', error);
    const outputElement = document.getElementById('output');
    outputElement.textContent = `Error: ${error.message}`;
    outputElement.className = 'result-error';
    toastSystem.show('Error testing function: ' + error.message, 'error');
  }
}

// Clear all data and reset the UI
function clearAll() {
  uid = '';
  functionList = [];
  currentFunction = '';
  fullCode = '';
  
  // Reset editor to default code
  editor.setValue(getDefaultCode(currentLanguage));
  
  // Clear function highlights
  clearFunctionHighlights();
  
  // Reset function dropdown
  updateFunctionDropdown([]);
  
  // Clear dynamic UI
  document.getElementById('dynamic-ui').innerHTML = '';
  
  // Reset output
  document.getElementById('output').textContent = 'Results will appear here after testing';
  document.getElementById('output').className = '';
  
  // Reset buttons
  document.getElementById('analyzeBtn').disabled = true;
  
  toastSystem.show('All data cleared', 'info');
}