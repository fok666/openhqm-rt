import { describe, it, expect, beforeEach } from 'vitest';
import { useSimulationStore } from './simulationStore';
import type { Route } from '../types';

describe('SimulationStore', () => {
  beforeEach(() => {
    // Clear the store before each test
    useSimulationStore.setState({
      simulations: [],
      currentSimulation: null,
      isRunning: false,
    });
  });

  it('should initialize with empty state', () => {
    const state = useSimulationStore.getState();
    expect(state.simulations).toEqual([]);
    expect(state.currentSimulation).toBeNull();
    expect(state.isRunning).toBe(false);
  });

  it('should clear simulations', () => {
    // Set some initial state
    useSimulationStore.setState({
      simulations: [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          input: { payload: {}, headers: {}, metadata: {} },
          trace: [],
          output: { errors: [] },
          metrics: { totalDuration: 0, matchingDuration: 0, transformDuration: 0 },
        },
      ],
      currentSimulation: null,
      isRunning: false,
    });

    const { clearSimulations } = useSimulationStore.getState();
    clearSimulations();

    const state = useSimulationStore.getState();
    expect(state.simulations).toEqual([]);
    expect(state.currentSimulation).toBeNull();
  });

  it('should select simulation', () => {
    const mockSimulation = {
      id: 'test-1',
      timestamp: new Date().toISOString(),
      input: { payload: { test: 'data' }, headers: {}, metadata: {} },
      trace: [],
      output: { actions: [], errors: [] },
      metrics: { totalDuration: 0, matchingDuration: 0, transformDuration: 0 },
    };

    useSimulationStore.setState({
      simulations: [mockSimulation],
      currentSimulation: null,
      isRunning: false,
    });

    const { selectSimulation } = useSimulationStore.getState();
    selectSimulation('test-1');

    const state = useSimulationStore.getState();
    expect(state.currentSimulation).toEqual(mockSimulation);
  });

  it('should handle selectSimulation with non-existent ID', () => {
    const { selectSimulation } = useSimulationStore.getState();
    selectSimulation('non-existent');

    const state = useSimulationStore.getState();
    // When ID doesn't exist, currentSimulation remains null or becomes undefined
    expect(state.currentSimulation).toBeNull();
  });

  it('should set isRunning to true during simulation', async () => {
    const mockRoutes: Route[] = [
      {
        name: 'Test Route',
        enabled: true,
        priority: 100,
        endpoint: 'http://test.com',
      },
    ];

    const mockInput = {
      payload: { orderId: 123 },
      headers: { 'x-test': 'value' },
      metadata: { source: 'test' },
    };

    const { startSimulation } = useSimulationStore.getState();

    // Start simulation (don't await to check isRunning state)
    const simulationPromise = startSimulation(mockInput, mockRoutes);

    // Check that isRunning was set to true
    expect(useSimulationStore.getState().isRunning).toBe(true);

    // Wait for completion
    await simulationPromise;
  });

  it('should create simulation with correct structure', async () => {
    const mockRoutes: Route[] = [];
    const mockInput = {
      payload: { test: 'data' },
      headers: {},
      metadata: {},
    };

    const { startSimulation } = useSimulationStore.getState();
    await startSimulation(mockInput, mockRoutes);

    const state = useSimulationStore.getState();
    expect(state.simulations).toHaveLength(1);
    expect(state.simulations[0]).toHaveProperty('id');
    expect(state.simulations[0]).toHaveProperty('timestamp');
    expect(state.simulations[0]).toHaveProperty('input');
    expect(state.simulations[0]).toHaveProperty('trace');
    expect(state.simulations[0]).toHaveProperty('output');
    expect(state.simulations[0]).toHaveProperty('metrics');
  });

  it('should add simulation to list', async () => {
    const mockRoutes: Route[] = [];
    const mockInput = {
      payload: { test: 'data' },
      headers: {},
      metadata: {},
    };

    const { startSimulation } = useSimulationStore.getState();

    await startSimulation(mockInput, mockRoutes);
    await startSimulation(mockInput, mockRoutes);

    const state = useSimulationStore.getState();
    expect(state.simulations).toHaveLength(2);
  });

  it('should set isRunning to false after simulation completes', async () => {
    const mockRoutes: Route[] = [];
    const mockInput = {
      payload: { test: 'data' },
      headers: {},
      metadata: {},
    };

    const { startSimulation } = useSimulationStore.getState();
    await startSimulation(mockInput, mockRoutes);

    const state = useSimulationStore.getState();
    expect(state.isRunning).toBe(false);
  });

  it('should handle route with transformation', async () => {
    const mockRoutes: Route[] = [
      {
        name: 'Transform Route',
        enabled: true,
        priority: 100,
        endpoint: 'http://test.com',
        transform_type: 'jq',
        transform: '{ orderId: .orderId }',
      },
    ];

    const mockInput = {
      payload: { orderId: 123, customerName: 'Test Customer' },
      headers: {},
      metadata: {},
    };

    const { startSimulation } = useSimulationStore.getState();
    await startSimulation(mockInput, mockRoutes);

    const state = useSimulationStore.getState();
    expect(state.simulations[0].trace).toBeDefined();
    expect(state.simulations[0].metrics.transformDuration).toBeGreaterThan(0);
  });

  it('should handle transformation errors', async () => {
    const mockRoutes: Route[] = [
      {
        name: 'Invalid Transform Route',
        enabled: true,
        priority: 100,
        endpoint: 'http://test.com',
        transform_type: 'jq',
        transform: 'invalid syntax here',
      },
    ];

    const mockInput = {
      payload: { test: 'data' },
      headers: {},
      metadata: {},
    };

    const { startSimulation } = useSimulationStore.getState();
    await startSimulation(mockInput, mockRoutes);

    const state = useSimulationStore.getState();
    expect(state.simulations[0].output.errors).toBeDefined();
  });

  it('should handle no matching routes scenario', async () => {
    const mockRoutes: Route[] = [
      {
        name: 'Conditional Route',
        enabled: true,
        priority: 100,
        match_field: 'userId',
        endpoint: 'http://test.com',
      },
    ];

    const mockInput = {
      payload: { orderId: 123 }, // No userId field
      headers: {},
      metadata: {},
    };

    const { startSimulation } = useSimulationStore.getState();
    await startSimulation(mockInput, mockRoutes);

    const state = useSimulationStore.getState();
    const warningError = state.simulations[0].output.errors.find((e) => e.severity === 'warning');
    expect(warningError).toBeDefined();
    expect(warningError?.message).toContain('No matching route');
  });

  it('should limit simulations to last 10', async () => {
    const mockRoutes: Route[] = [];
    const mockInput = {
      payload: { test: 'data' },
      headers: {},
      metadata: {},
    };

    const { startSimulation } = useSimulationStore.getState();

    // Run 15 simulations
    for (let i = 0; i < 15; i++) {
      await startSimulation(mockInput, mockRoutes);
    }

    const state = useSimulationStore.getState();
    expect(state.simulations).toHaveLength(10);
  });
});
