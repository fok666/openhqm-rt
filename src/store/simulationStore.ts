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
      // Step 1: Evaluate conditions on all routes
      const matchStart = performance.now();

      simulation.trace.push({
        step: 1,
        type: 'route',
        description: 'Evaluating conditions',
        input: input.payload,
        duration: 0,
        success: true,
      });

      const matchedRoute = await routeMatcher.matchRoute(routes, simulation);
      const matchDuration = performance.now() - matchStart;

      // Update timing on the first trace step
      simulation.trace[0].duration = matchDuration;
      simulation.metrics.matchingDuration = matchDuration;

      if (matchedRoute) {
        // Add individual condition evaluation entries
        if (matchedRoute.conditions) {
          matchedRoute.conditions.forEach((cond) => {
            simulation.trace.push({
              step: simulation.trace.length + 1,
              type: 'condition',
              description: `Condition: ${cond.field} ${cond.operator} ${cond.value || ''}`,
              duration: 0,
              success: true,
            });
          });
        }

        simulation.trace.push({
          step: simulation.trace.length + 1,
          type: 'route',
          description: `Route matched: ${matchedRoute.name}`,
          input: input.payload,
          output: matchedRoute.name,
          duration: 0,
          success: true,
        });

        simulation.trace.push({
          step: simulation.trace.length + 1,
          type: 'route',
          description: `Determining destination: ${matchedRoute.endpoint || 'default'}`,
          duration: 0,
          success: true,
        });

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
              message: `Transform error: ${transformResult.error || 'Transform failed'}`,
              context: 'JQ Transformation',
              suggestion: transformResult.suggestions?.[0],
            });
          }
        }
      } else {
        // Update first trace step to show failure
        simulation.trace[0].success = false;

        // Add failed condition traces for each evaluated route as trace steps
        const enabledRoutes = routes.filter((r) => r.enabled !== false);
        for (const route of enabledRoutes) {
          if (route.conditions && route.conditions.length > 0) {
            route.conditions.forEach((cond) => {
              simulation.trace.push({
                step: simulation.trace.length + 1,
                type: 'route',
                description: `condition failed: ${cond.field} ${cond.operator} ${cond.value || ''} (route: ${route.name})`,
                duration: 0,
                success: false,
              });
            });
          } else if (route.match_field) {
            simulation.trace.push({
              step: simulation.trace.length + 1,
              type: 'route',
              description: `condition failed: ${route.match_field} (route: ${route.name})`,
              duration: 0,
              success: false,
            });
          }
        }

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
    } catch (error: unknown) {
      simulation.output.errors.push({
        severity: 'error',
        message: error instanceof Error ? error.message : 'Simulation failed',
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
