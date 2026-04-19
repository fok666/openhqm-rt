// JQ service types
export interface TransformResult {
  success: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- JQ transforms produce arbitrary JSON
  output?: any;
  error?: string;
  suggestions?: string[];
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  suggestions?: string[];
}
