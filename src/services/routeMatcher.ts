import type { Route, SimulationContext } from '../types';

export class RouteMatcher {
  async matchRoute(routes: Route[], context: SimulationContext): Promise<Route | null> {
    // Sort by priority (higher first), defaulting to 100
    const sortedRoutes = routes
      .filter((r) => r.enabled !== false)
      .sort((a, b) => (b.priority ?? 100) - (a.priority ?? 100));

    for (const route of sortedRoutes) {
      if (this.evaluateRoute(route, context)) {
        return route;
      }
    }

    return null;
  }

  evaluateRoute(route: Route, context: SimulationContext): boolean {
    // Default routes always match (lowest priority fallback)
    if (route.is_default) {
      return true;
    }

    // No matching criteria means always match
    if (!route.match_field && !route.match_value && !route.match_pattern) {
      return true;
    }

    // Get the value at match_field from the payload
    if (route.match_field) {
      const fieldValue = this.getNestedValue(context.input.payload, route.match_field);

      // If neither match_value nor match_pattern is set, check field exists
      if (route.match_value === undefined && !route.match_pattern) {
        return fieldValue !== undefined && fieldValue !== null;
      }

      // Check exact match
      if (route.match_value !== undefined) {
        if (String(fieldValue) !== String(route.match_value)) {
          return false;
        }
      }

      // Check pattern match
      if (route.match_pattern) {
        try {
          const regex = new RegExp(route.match_pattern);
          if (!regex.test(String(fieldValue ?? ''))) {
            return false;
          }
        } catch {
          return false;
        }
      }

      return true;
    }

    // match_pattern without match_field: match against JSON string of payload
    if (route.match_pattern) {
      try {
        const regex = new RegExp(route.match_pattern);
        return regex.test(JSON.stringify(context.input.payload));
      } catch {
        return false;
      }
    }

    return false;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

// Singleton instance
export const routeMatcher = new RouteMatcher();
