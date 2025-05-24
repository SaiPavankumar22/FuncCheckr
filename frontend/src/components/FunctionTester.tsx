import React, { useState } from 'react';
import CodeSubmission from './CodeSubmission';
import FunctionSelection from './FunctionSelection';
import DynamicInputForm from './DynamicInputForm';
import ResultDisplay from './ResultDisplay';
import { FunctionSignature, InputRequirement } from '../types';

const FunctionTester: React.FC = () => {
  const [step, setStep] = useState<number>(1);
  const [code, setCode] = useState<string>('');
  const [functions, setFunctions] = useState<string[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<string>('');
  const [functionSignature, setFunctionSignature] = useState<FunctionSignature | null>(null);
  const [testResult, setTestResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Handle code submission
  const handleCodeSubmit = async (submittedCode: string) => {
    setIsLoading(true);
    setError('');
    try {
      // In a real app, this would be an actual API call
      const response = await fetch('/code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: submittedCode }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process code');
      }
      
      const data = await response.json();
      setCode(submittedCode);
      setFunctions(data.functions);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle function selection
  const handleFunctionSelect = async (functionName: string) => {
    setIsLoading(true);
    setError('');
    try {
      // In a real app, this would be an actual API call
      const response = await fetch('/code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: functionName }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to load function details');
      }
      
      const data = await response.json();
      setSelectedFunction(functionName);
      setFunctionSignature(data);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle function test
  const handleRunTest = async (inputs: Record<string, any>) => {
    setIsLoading(true);
    setError('');
    try {
      // In a real app, this would be an actual API call
      const response = await fetch('/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: selectedFunction, 
          inputs 
        }),
      });
      
      if (!response.ok) {
        throw new Error('Test execution failed');
      }
      
      const data = await response.json();
      setTestResult(JSON.stringify(data, null, 2));
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <CodeSubmission 
            onSubmit={handleCodeSubmit} 
            isLoading={isLoading} 
          />
        );
      case 2:
        return (
          <FunctionSelection 
            functions={functions} 
            onSelect={handleFunctionSelect} 
            isLoading={isLoading} 
          />
        );
      case 3:
        return (
          <DynamicInputForm 
            functionName={selectedFunction}
            requirements={functionSignature?.requirements || []}
            onSubmit={handleRunTest}
            isLoading={isLoading}
          />
        );
      case 4:
        return (
          <ResultDisplay 
            result={testResult} 
            onReset={() => setStep(1)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-8 transition-all duration-300">
      <h1 className="text-2xl font-bold text-center text-indigo-700 mb-6">
        Dynamic Function Runner
      </h1>
      
      {/* Progress indicators */}
      <div className="flex justify-between mb-6">
        {[1, 2, 3, 4].map((stepNumber) => (
          <div 
            key={stepNumber}
            className={`flex flex-col items-center ${stepNumber <= step ? 'text-indigo-600' : 'text-gray-300'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              stepNumber < step ? 'bg-indigo-600 text-white' : 
              stepNumber === step ? 'border-2 border-indigo-600 text-indigo-600' : 
              'border-2 border-gray-300 text-gray-300'
            }`}>
              {stepNumber}
            </div>
            <div className="text-xs mt-1">
              {stepNumber === 1 ? 'Code' : 
               stepNumber === 2 ? 'Select' : 
               stepNumber === 3 ? 'Input' : 'Result'}
            </div>
          </div>
        ))}
      </div>
      
      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {/* Current step */}
      <div className="transition-opacity duration-300">
        {renderStep()}
      </div>
    </div>
  );
};

export default FunctionTester;