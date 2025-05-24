import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { InputRequirement } from '../types';

interface DynamicInputFormProps {
  functionName: string;
  requirements: InputRequirement[];
  onSubmit: (inputs: Record<string, any>) => void;
  isLoading: boolean;
}

const DynamicInputForm: React.FC<DynamicInputFormProps> = ({
  functionName,
  requirements,
  onSubmit,
  isLoading
}) => {
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<Record<string, File>>({});

  const handleInputChange = (name: string, value: any) => {
    setInputs(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (name: string, file: File | null) => {
    if (file) {
      setFiles(prev => ({
        ...prev,
        [name]: file
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Combine regular inputs and files
    const formData = new FormData();
    
    // For a real implementation, you'd need to decide between FormData and JSON
    // based on whether there are file inputs
    const hasFileInputs = Object.keys(files).length > 0;
    
    if (hasFileInputs) {
      // Use FormData for file uploads
      Object.entries(inputs).forEach(([key, value]) => {
        formData.append(key, value);
      });
      
      Object.entries(files).forEach(([key, file]) => {
        formData.append(key, file);
      });
      
      // In a real implementation, you'd pass formData to onSubmit
      // For this mock, we'll just combine them into a single object
      const combinedInputs = {
        ...inputs,
        ...Object.fromEntries(
          Object.entries(files).map(([key, file]) => [key, file.name])
        )
      };
      
      onSubmit(combinedInputs);
    } else {
      // Use regular JSON if no files
      onSubmit(inputs);
    }
  };

  const renderInputField = (requirement: InputRequirement) => {
    const { name, type } = requirement;
    
    switch (type) {
      case 'string':
        return (
          <input
            type="text"
            id={name}
            name={name}
            value={inputs[name] || ''}
            onChange={(e) => handleInputChange(name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder={`Enter ${name}`}
            disabled={isLoading}
            required
          />
        );
        
      case 'number':
        return (
          <input
            type="number"
            id={name}
            name={name}
            value={inputs[name] || ''}
            onChange={(e) => handleInputChange(name, parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder={`Enter ${name}`}
            disabled={isLoading}
            required
          />
        );
        
      case 'file':
      case 'image':
        return (
          <input
            type="file"
            id={name}
            name={name}
            accept={type === 'image' ? 'image/*' : undefined}
            onChange={(e) => handleFileChange(name, e.target.files?.[0] || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isLoading}
            required
          />
        );
        
      default:
        return (
          <input
            type="text"
            id={name}
            name={name}
            value={inputs[name] || ''}
            onChange={(e) => handleInputChange(name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder={`Enter ${name}`}
            disabled={isLoading}
            required
          />
        );
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="text-gray-600 mb-2">
        Enter parameters for <span className="font-mono font-medium">{functionName}</span>:
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {requirements.length > 0 ? (
          requirements.map((req) => (
            <div key={req.name} className="space-y-1">
              <label htmlFor={req.name} className="block text-sm font-medium text-gray-700">
                {req.name} <span className="text-xs text-gray-500">({req.type})</span>
              </label>
              {renderInputField(req)}
            </div>
          ))
        ) : (
          <div className="py-2 text-gray-500 italic">
            This function doesn't require any inputs.
          </div>
        )}
        
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-2 px-4 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 ${
            isLoading 
              ? 'bg-indigo-300 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <LoadingSpinner size="sm" />
              <span className="ml-2">Running Test...</span>
            </div>
          ) : (
            'Run Test'
          )}
        </button>
      </form>
    </div>
  );
};

export default DynamicInputForm;