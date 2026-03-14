import yaml from 'js-yaml';
import type { Route, RoutingConfig } from '../types';
import { settings } from '../config/settings';

export class StorageService {
  private readonly ROUTES_KEY = settings.storage.localStorageKey;

  saveRoutes(routes: Route[]): void {
    try {
      localStorage.setItem(this.ROUTES_KEY, JSON.stringify(routes));
    } catch (error) {
      console.error('Failed to save routes:', error);
      throw new Error('Failed to save routes to localStorage');
    }
  }

  loadRoutes(): Route[] {
    try {
      const data = localStorage.getItem(this.ROUTES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load routes:', error);
      return [];
    }
  }

  clearRoutes(): void {
    localStorage.removeItem(this.ROUTES_KEY);
  }

  exportToYAML(routes: Route[]): string {
    const routingConfig: RoutingConfig = {
      version: '1.0',
      routes: routes,
      default_endpoint: 'default-service',
      enable_fallback: true,
    };

    const configMap = {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        name: settings.export.defaultConfigMapName,
        namespace: settings.export.defaultNamespace,
        labels: {
          app: 'openhqm',
          component: 'router',
          version: settings.app.version,
        },
        ...(settings.export.includeTimestamp && {
          annotations: {
            lastModified: new Date().toISOString(),
          },
        }),
      },
      data: {
        'routing.yaml': yaml.dump(routingConfig),
      },
    };

    return yaml.dump(configMap);
  }

  exportToJSON(routes: Route[]): string {
    const routingConfig: RoutingConfig = {
      version: '1.0',
      routes: routes,
      default_endpoint: 'default-service',
      enable_fallback: true,
    };

    const configMap = {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        name: settings.export.defaultConfigMapName,
        namespace: settings.export.defaultNamespace,
        labels: {
          app: 'openhqm',
          component: 'router',
          version: settings.app.version,
        },
        ...(settings.export.includeTimestamp && {
          annotations: {
            lastModified: new Date().toISOString(),
          },
        }),
      },
      data: {
        'routing.yaml': yaml.dump(routingConfig),
      },
    };

    return JSON.stringify(configMap, null, 2);
  }

  downloadFile(content: string, filename: string, mimeType: string = 'text/yaml'): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  importFromYAML(yamlContent: string): Route[] {
    try {
      const parsed: any = yaml.load(yamlContent);

      // Case 1: Direct routing configuration (routes array directly)
      if (Array.isArray(parsed)) {
        return parsed;
      }

      // Case 2: Routing config object with routes array
      if (parsed.routes && Array.isArray(parsed.routes)) {
        return parsed.routes;
      }

      // Case 3: Full ConfigMap format
      if (parsed.data) {
        // Try 'routing.yaml' key first (openhqm format)
        if (parsed.data['routing.yaml']) {
          const routingConfig = yaml.load(parsed.data['routing.yaml']) as RoutingConfig;
          return routingConfig.routes;
        }
        // Fallback to 'routes.yaml' key
        if (parsed.data['routes.yaml']) {
          const routingConfig = yaml.load(parsed.data['routes.yaml']) as RoutingConfig;
          return routingConfig.routes;
        }
      }

      throw new Error('Invalid YAML format: Expected routes array or valid ConfigMap');
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    }
  }
}

// Singleton instance
export const storageService = new StorageService();
