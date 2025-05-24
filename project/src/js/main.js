/**
 * Main application initialization
 */

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Initialize toast notification system
  toastSystem.init();
  
  // Initialize the Monaco editor
  initEditor();
  
  // Set up event listeners
  setupEventListeners();
  
  // Show welcome message
  setTimeout(() => {
    toastSystem.show('Welcome to FuncCheckr! Enter your code and click "Analyze Code" to start testing.', 'info', 5000);
  }, 1000);
});

// Set up event listeners for the UI
function setupEventListeners() {
  // Language selector
  const languageSelector = document.getElementById('languageSelector');
  languageSelector.addEventListener('change', function() {
    changeEditorLanguage(this.value);
  });
  
  // Submit code button
  const submitCodeBtn = document.getElementById('submitCodeBtn');
  submitCodeBtn.addEventListener('click', submitCode);
  
  // Analyze function button
  const analyzeBtn = document.getElementById('analyzeBtn');
  analyzeBtn.addEventListener('click', analyzeFunction);
  
  // Function dropdown change
  const functionDropdown = document.getElementById('functionDropdown');
  functionDropdown.addEventListener('change', function() {
    if (this.value) {
      highlightFunction(this.value);
    } else {
      clearFunctionHighlights();
    }
  });
  
  // Clear button
  const clearBtn = document.getElementById('clearBtn');
  clearBtn.addEventListener('click', clearAll);
  
  // Handle window resize
  window.addEventListener('resize', function() {
    // Adjust any floating panels if they exist
    const panels = document.querySelectorAll('.floating-input');
    if (panels.length > 0 && currentFunction) {
      const bounds = detectFunctionBounds(getEditorContent(), currentFunction, currentLanguage);
      if (bounds) {
        panels.forEach(panel => {
          positionFloatingPanel(panel, bounds.startLine + 1);
        });
      }
    }
  });
}