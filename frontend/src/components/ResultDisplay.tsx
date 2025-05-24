import React from 'react';

interface ResultDisplayProps {
  result: string;
  onReset: () => void;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, onReset }) => {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="text-gray-600 mb-2">
        Function execution completed successfully:
      </div>
      
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <pre className="whitespace-pre-wrap text-sm font-mono overflow-auto max-h-60">
          {result || 'No result returned'}
        </pre>
      </div>
      
      <div className="flex space-x-3">
        <button
          onClick={onReset}
          className="flex-1 py-2 px-4 border border-indigo-600 rounded-md text-indigo-600 font-medium hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
        >
          Test Another Function
        </button>
      </div>
    </div>
  );
};

export default ResultDisplay;