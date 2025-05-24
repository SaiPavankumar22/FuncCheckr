import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface CodeSubmissionProps {
  onSubmit: (code: string) => void;
  isLoading: boolean;
}

const CodeSubmission: React.FC<CodeSubmissionProps> = ({ onSubmit, isLoading }) => {
  const [code, setCode] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      onSubmit(code);
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="text-gray-600 mb-2">
        Paste your Python code below to analyze and test its functions
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
            Paste your Python code here
          </label>
          <textarea
            id="code"
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="def hello(name):\n    return f'Hello, {name}!'"
            disabled={isLoading}
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading || !code.trim()}
          className={`w-full py-2 px-4 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 ${
            isLoading || !code.trim() 
              ? 'bg-indigo-300 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <LoadingSpinner size="sm" />
              <span className="ml-2">Analyzing Code...</span>
            </div>
          ) : (
            'Submit Code'
          )}
        </button>
      </form>
    </div>
  );
};

export default CodeSubmission;