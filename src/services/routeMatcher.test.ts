import { describe, it, expect, beforeAll } from 'vitest';
import { RouteMatcher } from './routeMatcher';
import type { Route, SimulationContext } from '../types';

describe('RouteMatcher', () => {
  let routeMatcher: RouteMatcher;

  beforeAll(() => {
    routeMatcher = new RouteMatcher();
  });

  const createMockRoute = (overrides?: Partial<Route>): Route => ({
    name: 'Test Route',
    enabled: true,
    priority: 100,
    endpoint: 'http://test-endpoint.com',
    ...overrides,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test helper with arbitrary payloads
  const createMockContext = (payload?: any): SimulationContext => ({
    id: 'sim-001',
    timestamp: new Date().toISOString(),
    input: {
      payload: payload || { order: { priority: 'high' } },
      headers: { 'Content-Type': 'application/json' },
      metadata: {},
    },
    trace: [],
    output: {
      errors: [],
    },
    metrics: {
      totalDuration: 0,
      matchingDuration: 0,
      transformDuration: 0,
    },
  });

  describe('matchRoute', () => {
    it('should match route with no conditions', async () => {
      const routes = [createMockRoute()];
      const context = createMockContext();

      const matched = await routeMatcher.matchRoute(routes, context);

      expect(matched).toBeDefined();
      expect(matched?.name).toBe('Test Route');
    });

    it('should return null when no routes match', async () => {
      const routes = [
        createMockRoute({
          match_field: 'order.priority',
          match_value: 'low',
        }),
      ];
      const context = createMockContext({ order: { priority: 'high' } });

      const matched = await routeMatcher.matchRoute(routes, context);

      expect(matched).toBeNull();
    });

    it('should skip disabled routes', async () => {
      const routes = [
        createMockRoute({ name: 'Disabled', enabled: false, priority: 200 }),
        createMockRoute({ name: 'Enabled', enabled: true, priority: 100 }),
      ];
      const context = createMockContext();

      const matched = await routeMatcher.matchRoute(routes, context);

      expect(matched).toBeDefined();
      expect(matched?.name).toBe('Enabled');
    });

    it('should match route with highest priority', async () => {
      const routes = [
        createMockRoute({ name: 'Low Priority', priority: 50 }),
        createMockRoute({ name: 'High Priority', priority: 200 }),
        createMockRoute({ name: 'Medium Priority', priority: 100 }),
      ];
      const context = createMockContext();

      const matched = await routeMatcher.matchRoute(routes, context);

      expect(matched?.name).toBe('High Priority');
    });

    it('should default priority to 100', async () => {
      const routes = [
        createMockRoute({ name: 'No Priority', priority: undefined }),
        createMockRoute({ name: 'Priority 50', priority: 50 }),
      ];
      const context = createMockContext();

      const matched = await routeMatcher.matchRoute(routes, context);

      expect(matched?.name).toBe('No Priority');
    });
  });

  describe('evaluateRoute', () => {
    it('should match on exact field value', () => {
      const route = createMockRoute({
        match_field: 'order.priority',
        match_value: 'high',
      });
      const context = createMockContext({ order: { priority: 'high' } });

      const result = routeMatcher.evaluateRoute(route, context);

      expect(result).toBe(true);
    });

    it('should not match when field value differs', () => {
      const route = createMockRoute({
        match_field: 'order.priority',
        match_value: 'low',
      });
      const context = createMockContext({ order: { priority: 'high' } });

      const result = routeMatcher.evaluateRoute(route, context);

      expect(result).toBe(false);
    });

    it('should match on regex pattern', () => {
      const route = createMockRoute({
        match_field: 'order.email',
        match_pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
      });
      const context = createMockContext({ order: { email: 'test@example.com' } });

      const result = routeMatcher.evaluateRoute(route, context);

      expect(result).toBe(true);
    });

    it('should not match when regex pattern fails', () => {
      const route = createMockRoute({
        match_field: 'order.email',
        match_pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
      });
      const context = createMockContext({ order: { email: 'not-an-email' } });

      const result = routeMatcher.evaluateRoute(route, context);

      expect(result).toBe(false);
    });

    it('should match both value and pattern when both specified', () => {
      const route = createMockRoute({
        match_field: 'order.type',
        match_value: 'urgent',
        match_pattern: '^urgent$',
      });
      const context = createMockContext({ order: { type: 'urgent' } });

      const result = routeMatcher.evaluateRoute(route, context);

      expect(result).toBe(true);
    });

    it('should handle nested field access', () => {
      const route = createMockRoute({
        match_field: 'order.customer.type',
        match_value: 'premium',
      });
      const context = createMockContext({
        order: { customer: { type: 'premium' } },
      });

      const result = routeMatcher.evaluateRoute(route, context);

      expect(result).toBe(true);
    });

    it('should handle missing nested fields gracefully', () => {
      const route = createMockRoute({
        match_field: 'order.customer.type',
        match_value: 'premium',
      });
      const context = createMockContext({ order: {} });

      const result = routeMatcher.evaluateRoute(route, context);

      expect(result).toBe(false);
    });

    it('should always match default routes', () => {
      const route = createMockRoute({
        is_default: true,
        match_field: 'nonexistent',
        match_value: 'never',
      });
      const context = createMockContext();

      const result = routeMatcher.evaluateRoute(route, context);

      expect(result).toBe(true);
    });

    it('should match routes with no matching criteria', () => {
      const route = createMockRoute();
      const context = createMockContext();

      const result = routeMatcher.evaluateRoute(route, context);

      expect(result).toBe(true);
    });

    it('should handle invalid regex gracefully', () => {
      const route = createMockRoute({
        match_field: 'order.type',
        match_pattern: '[invalid',
      });
      const context = createMockContext({ order: { type: 'test' } });

      const result = routeMatcher.evaluateRoute(route, context);

      expect(result).toBe(false);
    });

    it('should match pattern against full payload when no match_field', () => {
      const route = createMockRoute({
        match_pattern: 'premium',
      });
      const context = createMockContext({ customer: { type: 'premium' } });

      const result = routeMatcher.evaluateRoute(route, context);

      expect(result).toBe(true);
    });
  });
});
