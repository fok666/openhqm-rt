// Simulation and testing types
export interface SimulationContext {
  id: string;
  timestamp: string;

  // Input
  input: {
    payload: any;
    headers: Record<string, string>;
    metadata: Record<string, any>;
  };

  // Execution trace
  trace: SimulationStep[];

  // Output
  output: {
    matchedRoute?: string;
    transformedPayload?: any;
    destination?: string;
    errors: SimulationError[];
  };

  // Metrics
  metrics: {
    totalDuration: number;
    matchingDuration: number;
    transformDuration: number;
  };
}

export interface SimulationStep {
  step: number;
  type: 'condition' | 'transform' | 'action' | 'route';
  description: string;
  input?: any;
  output?: any;
  duration: number;
  success: boolean;
  error?: string;
}

export interface ExecutedAction {
  type: string;
  key: string;
  value: any;
  success: boolean;
}

export interface SimulationError {
  severity: 'error' | 'warning';
  message: string;
  context?: string;
  suggestion?: string;
}

export interface TestCase {
  id: string;
  name: string;
  description: string;
  routeName?: string; // Name of expected matching route
  input: {
    payload: any;
    headers: Record<string, string>;
    metadata: Record<string, any>;
  };
  expectedOutput?: {
    routeName: string; // Expected route name to match
    transformedPayload?: any;
    destination?: string;
  };
  createdAt: string;
}
