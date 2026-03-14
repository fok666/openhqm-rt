import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { SimulationContext, Route } from '../types';
import { routeMatcher, jqService } from '../services';

interface SimulationStore {
  simulations: SimulationContext[];
  currentSimulation: SimulationContext | null;
  isRunning: boolean;

  // Actions
  startSimulation: (input: SimulationContext['input'], routes: Route[]) => Promise<void>;
  clearSimulations: () => void;
  selectSimulation: (id: string) => void;
}

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  simulations: [],
  currentSimulation: null,
  isRunning: false,

  startSimulation: async (input, routes) => {
    set({ isRunning: true });

    const simulation: SimulationContext = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      input,
      trace: [],
      output: {
        errors: [],
      },
      metrics: {
        totalDuration: 0,
        matchingDuration: 0,
        transformDuration: 0,
      },
    };

    const startTime = performance.now();

    try {
      // Step 1: Find matching route
      const matchStart = performance.now();
      const matchedRoute = await routeMatcher.matchRoute(routes, simulation);
      const matchDuration = performance.now() - matchStart;

      simulation.trace.push({
        step: 1,
        type: 'route',
        description: matchedRoute
          ? `Matched route: ${matchedRoute.name}`
          : 'No matching route found',
        input: input.payload,
        output: matchedRoute?.name,
        duration: matchDuration,
        success: !!matchedRoute,
      });

      simulation.metrics.matchingDuration = matchDuration;

      if (matchedRoute) {
        simulation.output.matchedRoute = matchedRoute.name;
        simulation.output.destination = matchedRoute.endpoint;

        // Step 2: Apply transformation if configured
        if (matchedRoute.transform_type && matchedRoute.transform_type !== 'passthrough') {
          const transformStart = performance.now();
          const transformResult = await jqService.transform(
            matchedRoute.transform || '',
            input.payload
          );
          const transformDuration = performance.now() - transformStart;

          simulation.trace.push({
            step: 2,
            type: 'transform',
            description: 'Applied JQ transformation',
            input: input.payload,
            output: transformResult.output,
            duration: transformDuration,
            success: transformResult.success,
            error: transformResult.error,
          });

          simulation.metrics.transformDuration = transformDuration;

          if (transformResult.success) {
            simulation.output.transformedPayload = transformResult.output;
          } else {
            simulation.output.errors.push({
              severity: 'error',
              message: transformResult.error || 'Transform failed',
              context: 'JQ Transformation',
              suggestion: transformResult.suggestions?.[0],
            });
          }
        }
      } else {
        simulation.output.errors.push({
          severity: 'warning',
          message: 'No matching route found for the given input',
          context: 'Route Matching',
        });
      }

      const totalDuration = performance.now() - startTime;
      simulation.metrics.totalDuration = totalDuration;

      set({
        simulations: [simulation, ...get().simulations].slice(0, 10), // Keep last 10
        currentSimulation: simulation,
        isRunning: false,
      });
    } catch (error: any) {
      simulation.output.errors.push({
        severity: 'error',
        message: error.message || 'Simulation failed',
        context: 'Simulation',
      });

      set({
        currentSimulation: simulation,
        isRunning: false,
      });
    }
  },

  clearSimulations: () => {
    set({ simulations: [], currentSimulation: null });
  },

  selectSimulation: (id) => {
    const simulation = get().simulations.find((s) => s.id === id);
    if (simulation) {
      set({ currentSimulation: simulation });
    }
  },
}));
