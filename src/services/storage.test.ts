import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StorageService } from './storage';
import type { Route } from '../types';

describe('StorageService', () => {
  let storageService: StorageService;
  const mockRoute: Route = {
    id: 'route-001',
    name: 'Test Route',
    description: 'Test description',
    enabled: true,
    priority: 100,
    conditions: [
      {
        type: 'payload',
        field: 'order.priority',
        operator: 'equals',
        value: 'high',
      },
    ],
    conditionOperator: 'AND',
    actions: [],
    destination: {
      type: 'endpoint',
      target: 'test-endpoint',
    },
  };

  beforeEach(() => {
    storageService = new StorageService();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('saveRoutes', () => {
    it('should save routes to localStorage', () => {
      const routes = [mockRoute];

      storageService.saveRoutes(routes);

      const saved = localStorage.getItem('openhqm_routes');
      expect(saved).toBeDefined();
      expect(JSON.parse(saved!)).toEqual(routes);
    });

    it('should overwrite existing routes', () => {
      const routes1 = [mockRoute];
      const routes2 = [{ ...mockRoute, id: 'route-002', name: 'New Route' }];

      storageService.saveRoutes(routes1);
      storageService.saveRoutes(routes2);

      const saved = localStorage.getItem('openhqm_routes');
      expect(JSON.parse(saved!)).toEqual(routes2);
    });
  });

  describe('loadRoutes', () => {
    it('should load routes from localStorage', () => {
      const routes = [mockRoute];
      localStorage.setItem('openhqm_routes', JSON.stringify(routes));

      const loaded = storageService.loadRoutes();

      expect(loaded).toEqual(routes);
    });

    it('should return empty array when no routes exist', () => {
      const loaded = storageService.loadRoutes();

      expect(loaded).toEqual([]);
    });

    it('should return empty array on invalid JSON', () => {
      localStorage.setItem('openhqm_routes', 'invalid json');

      const loaded = storageService.loadRoutes();

      expect(loaded).toEqual([]);
    });
  });

  describe('clearRoutes', () => {
    it('should clear routes from localStorage', () => {
      const routes = [mockRoute];
      storageService.saveRoutes(routes);

      storageService.clearRoutes();

      const saved = localStorage.getItem('openhqm_routes');
      expect(saved).toBeNull();
    });
  });

  describe('exportToYAML', () => {
    it('should export routes as YAML ConfigMap', () => {
      const routes = [mockRoute];

      const yaml = storageService.exportToYAML(routes);

      expect(yaml).toContain('apiVersion: v1');
      expect(yaml).toContain('kind: ConfigMap');
      expect(yaml).toContain('name: openhqm-routes');
      expect(yaml).toContain('Test Route');
    });

    it('should include route metadata in YAML', () => {
      const routes = [mockRoute];

      const yaml = storageService.exportToYAML(routes);

      expect(yaml).toContain('route-001');
      expect(yaml).toContain('priority: 100');
      expect(yaml).toContain('enabled: true');
    });
  });

  describe('exportToJSON', () => {
    it('should export routes as JSON ConfigMap', () => {
      const routes = [mockRoute];

      const json = storageService.exportToJSON(routes);
      const parsed = JSON.parse(json);

      expect(parsed.apiVersion).toBe('v1');
      expect(parsed.kind).toBe('ConfigMap');
      expect(parsed.metadata.name).toBe('openhqm-routes');
    });

    it('should include all route data in JSON', () => {
      const routes = [mockRoute];

      const json = storageService.exportToJSON(routes);

      expect(json).toContain('route-001');
      expect(json).toContain('Test Route');
    });
  });

  describe('importFromYAML', () => {
    it('should import routes from YAML ConfigMap', () => {
      const yamlContent = `
apiVersion: v1
kind: ConfigMap
metadata:
  name: openhqm-routes
  namespace: openhqm
data:
  routes.yaml: |
    version: "1.0"
    routes:
      - id: route-001
        name: Imported Route
        enabled: true
        priority: 100
        conditions: []
        conditionOperator: AND
        actions: []
        destination:
          type: endpoint
          target: test
`;

      const routes = storageService.importFromYAML(yamlContent);

      expect(routes).toHaveLength(1);
      expect(routes[0].id).toBe('route-001');
      expect(routes[0].name).toBe('Imported Route');
    });

    it('should throw error on invalid ConfigMap format', () => {
      const invalidYaml = 'invalid: yaml';

      expect(() => storageService.importFromYAML(invalidYaml)).toThrow();
    });

    it('should throw error when routes.yaml is missing', () => {
      const yamlContent = `
apiVersion: v1
kind: ConfigMap
metadata:
  name: openhqm-routes
data:
  other.yaml: "content"
`;

      expect(() => storageService.importFromYAML(yamlContent)).toThrow();
    });
  });
});
