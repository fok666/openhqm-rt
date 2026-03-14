import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useRouteStore } from './routeStore';
import type { Route } from '../types';

describe('RouteStore', () => {
  const mockRoute: Route = {
    id: 'route-001',
    name: 'Test Route',
    enabled: true,
    priority: 100,
    conditions: [],
    conditionOperator: 'AND',
    actions: [],
    destination: {
      type: 'endpoint',
      target: 'test-endpoint',
    },
  };

  beforeEach(() => {
    localStorage.clear();
    useRouteStore.setState({
      routes: [],
      selectedRoute: null,
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('loadRoutes', () => {
    it('should load routes from localStorage', () => {
      localStorage.setItem('openhqm_routes', JSON.stringify([mockRoute]));

      useRouteStore.getState().loadRoutes();

      const routes = useRouteStore.getState().routes;
      expect(routes).toHaveLength(1);
      expect(routes[0].id).toBe('route-001');
    });

    it('should load empty array when no routes exist', () => {
      useRouteStore.getState().loadRoutes();

      const routes = useRouteStore.getState().routes;
      expect(routes).toEqual([]);
    });
  });

  describe('setRoutes', () => {
    it('should save routes to localStorage and state', () => {
      useRouteStore.getState().setRoutes([mockRoute]);

      const routes = useRouteStore.getState().routes;
      expect(routes).toHaveLength(1);

      const saved = localStorage.getItem('openhqm_routes');
      expect(saved).toBeDefined();
      expect(JSON.parse(saved!)).toEqual([mockRoute]);
    });
  });

  describe('selectRoute', () => {
    it('should set selected route', () => {
      useRouteStore.getState().selectRoute(mockRoute);

      const selected = useRouteStore.getState().selectedRoute;
      expect(selected).toEqual(mockRoute);
    });

    it('should clear selected route when null', () => {
      useRouteStore.getState().selectRoute(mockRoute);
      useRouteStore.getState().selectRoute(null);

      const selected = useRouteStore.getState().selectedRoute;
      expect(selected).toBeNull();
    });
  });

  describe('addRoute', () => {
    it('should add new route with generated ID', () => {
      const newRoute = { ...mockRoute };
      delete (newRoute as any).id;

      useRouteStore.getState().addRoute(newRoute as any);

      const routes = useRouteStore.getState().routes;
      expect(routes).toHaveLength(1);
      expect(routes[0].id).toBeDefined();
      expect(routes[0].name).toBe('Test Route');
    });

    it('should set new route as selected', () => {
      const newRoute = { ...mockRoute };
      delete (newRoute as any).id;

      useRouteStore.getState().addRoute(newRoute as any);

      const selected = useRouteStore.getState().selectedRoute;
      expect(selected).toBeDefined();
      expect(selected?.name).toBe('Test Route');
    });
  });

  describe('updateRoute', () => {
    it('should update existing route', () => {
      useRouteStore.getState().setRoutes([mockRoute]);

      useRouteStore.getState().updateRoute('route-001', { name: 'Updated Route' });

      const routes = useRouteStore.getState().routes;
      expect(routes[0].name).toBe('Updated Route');
    });

    it('should update selected route if it matches', () => {
      useRouteStore.getState().setRoutes([mockRoute]);
      useRouteStore.getState().selectRoute(mockRoute);

      useRouteStore.getState().updateRoute('route-001', { name: 'Updated Route' });

      const selected = useRouteStore.getState().selectedRoute;
      expect(selected?.name).toBe('Updated Route');
    });

    it('should not affect other routes', () => {
      const route2 = { ...mockRoute, id: 'route-002', name: 'Route 2' };
      useRouteStore.getState().setRoutes([mockRoute, route2]);

      useRouteStore.getState().updateRoute('route-001', { name: 'Updated Route' });

      const routes = useRouteStore.getState().routes;
      expect(routes[1].name).toBe('Route 2');
    });
  });

  describe('deleteRoute', () => {
    it('should delete route by ID', () => {
      useRouteStore.getState().setRoutes([mockRoute]);

      useRouteStore.getState().deleteRoute('route-001');

      const routes = useRouteStore.getState().routes;
      expect(routes).toHaveLength(0);
    });

    it('should clear selected route if deleted', () => {
      useRouteStore.getState().setRoutes([mockRoute]);
      useRouteStore.getState().selectRoute(mockRoute);

      useRouteStore.getState().deleteRoute('route-001');

      const selected = useRouteStore.getState().selectedRoute;
      expect(selected).toBeNull();
    });
  });

  describe('duplicateRoute', () => {
    it('should create copy of route', () => {
      useRouteStore.getState().setRoutes([mockRoute]);

      useRouteStore.getState().duplicateRoute('route-001');

      const routes = useRouteStore.getState().routes;
      expect(routes).toHaveLength(2);
      expect(routes[1].name).toBe('Test Route (Copy)');
    });

    it('should generate new ID for duplicated route', () => {
      useRouteStore.getState().setRoutes([mockRoute]);

      useRouteStore.getState().duplicateRoute('route-001');

      const routes = useRouteStore.getState().routes;
      expect(routes[0].id).not.toBe(routes[1].id);
    });
  });

  describe('reorderRoutes', () => {
    it('should reorder routes', () => {
      const route1 = { ...mockRoute, id: 'route-001', name: 'Route 1' };
      const route2 = { ...mockRoute, id: 'route-002', name: 'Route 2' };
      const route3 = { ...mockRoute, id: 'route-003', name: 'Route 3' };
      useRouteStore.getState().setRoutes([route1, route2, route3]);

      useRouteStore.getState().reorderRoutes(0, 2);

      const routes = useRouteStore.getState().routes;
      expect(routes[0].name).toBe('Route 2');
      expect(routes[1].name).toBe('Route 3');
      expect(routes[2].name).toBe('Route 1');
    });
  });

  describe('error handling', () => {
    it('should set error on save failure', () => {
      // Mock localStorage to throw error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = () => {
        throw new Error('Storage quota exceeded');
      };

      useRouteStore.getState().setRoutes([mockRoute]);

      const error = useRouteStore.getState().error;
      expect(error).toBeDefined();

      // Restore
      localStorage.setItem = originalSetItem;
    });

    it('should clear error', () => {
      useRouteStore.setState({ error: 'Test error' });

      useRouteStore.getState().clearError();

      const error = useRouteStore.getState().error;
      expect(error).toBeNull();
    });
  });
});
