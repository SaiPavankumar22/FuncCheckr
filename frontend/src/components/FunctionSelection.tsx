import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface FunctionSelectionProps {
  functions: string[];
  onSelect: (functionName: string) => void;
  isLoading: boolean;
}

const FunctionSelection: React.FC<FunctionSelectionProps> = ({ 
  functions, 
  onSelect, 
  isLoading 
}) => {
  const [selectedFunction, setSelectedFunction] = useState<string>(
    functions.length > 0 ? functions[0] : ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFunction) {
      onSelect(selectedFunction);
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="text-gray-600 mb-2">
        {functions.length > 0 
          ? `Found ${functions.length} function${functions.length > 1 ? 's' : ''}. Select one to test:`
          : 'No functions found in the submitted code.'}
      </div>
      
      {functions.length > 0 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="function" className="block text-sm font-medium text-gray-700 mb-1">
              Select a function to test
            </label>
            <div className="flex space-x-2">
              <select
                id="function"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={selectedFunction}
                onChange={(e) => setSelectedFunction(e.target.value)}
                disabled={isLoading}
              >
                {functions.map((fn) => (
                  <option key={fn} value={fn}>
                    {fn}
                  </option>
                ))}
              </select>
              
              <button
                type="submit"
                disabled={isLoading || !selectedFunction}
                className={`py-2 px-4 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 ${
                  isLoading || !selectedFunction 
                    ? 'bg-indigo-300 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Loading...</span>
                  </div>
                ) : (
                  'Load Function'
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default FunctionSelection;