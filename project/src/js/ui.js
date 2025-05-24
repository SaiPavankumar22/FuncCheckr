/**
 * UI interaction and dynamic elements
 */

// Function to create a floating input panel beside a function
function createFloatingInputPanel(functionName, inputs, startLine, endLine) {
  // Remove any existing floating panels
  removeFloatingInputPanels();
  
  // Create the floating panel
  const panel = document.createElement('div');
  panel.className = 'floating-input';
  panel.id = `floating-input-${functionName}`;
  
  // Add header with function name and close button
  const header = document.createElement('div');
  header.className = 'input-field-header';
  
  const title = document.createElement('h3');
  title.textContent = `Test ${functionName}()`;
  
  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-btn';
  closeBtn.innerHTML = '&times;';
  closeBtn.onclick = () => {
    panel.style.animation = 'fadeOut var(--transition)';
    panel.addEventListener('animationend', () => {
      panel.remove();
    });
  };
  
  header.appendChild(title);
  header.appendChild(closeBtn);
  panel.appendChild(header);
  
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
    field.id = `floating-input-${functionName}-${input.name}`;
    field.className = 'form-control';
    
    inputGroup.appendChild(label);
    inputGroup.appendChild(field);
    panel.appendChild(inputGroup);
  });
  
  // Add test button
  const actionDiv = document.createElement('div');
  actionDiv.className = 'input-actions';
  
  const testBtn = document.createElement('button');
  testBtn.className = 'btn primary';
  testBtn.textContent = 'Run Test';
  testBtn.onclick = () => {
    // Collect inputs from floating panel
    const inputValues = inputs.map(input => {
      const field = document.getElementById(`floating-input-${functionName}-${input.name}`);
      return {
        name: input.name,
        value: input.type === 'image' ? field.files[0] : field.value,
        type: input.type
      };
    });
    
    // Test function with collected inputs
    testFunctionWithInputs(functionName, inputValues);
  };
  
  actionDiv.appendChild(testBtn);
  panel.appendChild(actionDiv);
  
  // Add to DOM
  document.body.appendChild(panel);
  
  // Position the panel next to the editor
  positionFloatingPanel(panel, startLine);
  
  return panel;
}

// Position the floating panel next to the function in the editor
function positionFloatingPanel(panel, startLine) {
  // Get the position of the editor container
  const editorContainer = document.getElementById('editor-container');
  const editorRect = editorContainer.getBoundingClientRect();
  
  // Calculate the position of the line in the editor
  const lineHeight = 19; // Approximate line height in pixels
  const topOffset = (startLine * lineHeight) - editor.getScrollTop();
  
  // Position the panel
  panel.style.top = `${Math.max(editorRect.top + topOffset, editorRect.top + 10)}px`;
  panel.style.left = `${editorRect.right + 20}px`;
  
  // Check if panel goes beyond viewport height and adjust if needed
  const panelRect = panel.getBoundingClientRect();
  if (panelRect.bottom > window.innerHeight - 20) {
    panel.style.top = `${window.innerHeight - panelRect.height - 20}px`;
  }
}

// Remove all floating input panels
function removeFloatingInputPanels() {
  const panels = document.querySelectorAll('.floating-input');
  panels.forEach(panel => {
    panel.remove();
  });
}

// Test function with inputs from floating panel
async function testFunctionWithInputs(functionName, inputValues) {
  try {
    // Collect input values into FormData
    const formData = new FormData();
    formData.append('full_code', fullCode);
    formData.append('uid', uid);
    formData.append('functionName', functionName);
    formData.append('language', currentLanguage);
    
    let hasAllInputs = true;
    
    inputValues.forEach(input => {
      if (input.type !== 'image' && (!input.value || input.value.trim() === '')) {
        hasAllInputs = false;
        return;
      }
      
      if (input.type === 'image') {
        formData.append(input.name, input.value);
      } else {
        formData.append(input.name, input.value);
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