// Simulation and testing types
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- simulation operates on arbitrary JSON payloads
type JsonValue = any;

export interface SimulationContext {
  id: string;
  timestamp: string;

  // Input
  input: {
    payload: JsonValue;
    headers: Record<string, string>;
    metadata: Record<string, JsonValue>;
  };

  // Execution trace
  trace: SimulationStep[];

  // Output
  output: {
    matchedRoute?: string;
    transformedPayload?: JsonValue;
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
  input?: JsonValue;
  output?: JsonValue;
  duration: number;
  success: boolean;
  error?: string;
}

export interface ExecutedAction {
  type: string;
  key: string;
  value: JsonValue;
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
    payload: JsonValue;
    headers: Record<string, string>;
    metadata: Record<string, JsonValue>;
  };
  expectedOutput?: {
    routeName: string; // Expected route name to match
    transformedPayload?: JsonValue;
    destination?: string;
  };
  createdAt: string;
}
