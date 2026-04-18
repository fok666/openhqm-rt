import type { Route, SimulationContext } from '../types';

export class RouteMatcher {
  private regexCache = new Map<string, RegExp | null>();

  private getRegex(pattern: string): RegExp | null {
    if (this.regexCache.has(pattern)) {
      return this.regexCache.get(pattern)!;
    }
    try {
      const regex = new RegExp(pattern);
      this.regexCache.set(pattern, regex);
      return regex;
    } catch {
      this.regexCache.set(pattern, null);
      return null;
    }
  }

  async matchRoute(routes: Route[], context: SimulationContext): Promise<Route | null> {
    // Sort by priority (higher first), defaulting to 100
    const sortedRoutes = routes
      .filter((r) => r.enabled !== false)
      .sort((a, b) => (b.priority ?? 100) - (a.priority ?? 100));

    // Pre-stringify payload once for routes that match against full payload
    let payloadString: string | undefined;

    for (const route of sortedRoutes) {
      if (
        this.evaluateRoute(route, context, () => {
          if (payloadString === undefined) {
            payloadString = JSON.stringify(context.input.payload);
          }
          return payloadString;
        })
      ) {
        return route;
      }
    }

    return null;
  }

  evaluateRoute(
    route: Route,
    context: SimulationContext,
    getPayloadString?: () => string
  ): boolean {
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
        const regex = this.getRegex(route.match_pattern);
        if (!regex || !regex.test(String(fieldValue ?? ''))) {
          return false;
        }
      }

      return true;
    }

    // match_pattern without match_field: match against JSON string of payload
    if (route.match_pattern) {
      const regex = this.getRegex(route.match_pattern);
      if (!regex) return false;
      const str = getPayloadString ? getPayloadString() : JSON.stringify(context.input.payload);
      return regex.test(str);
    }

    return false;
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path
      .split('.')
      .reduce<unknown>((current, key) => (current as Record<string, unknown>)?.[key], obj);
  }
}

// Singleton instance
export const routeMatcher = new RouteMatcher();
