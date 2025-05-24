export interface InputRequirement {
  name: string;
  type: 'string' | 'number' | 'file' | 'image';
}

export interface FunctionSignature {
  signature: string;
  requirements: InputRequirement[];
}