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

    // If route has conditions array, evaluate them
    if (route.conditions && route.conditions.length > 0) {
      return this.evaluateConditions(route, context);
    }

    // No matching criteria means always match
    if (!route.match_field && !route.match_value && !route.match_pattern) {
      return true;
    }

    // Legacy: Get the value at match_field from the payload
    if (route.match_field) {
      const fieldValue = this.getNestedValue(context.input.payload, route.match_field);

      if (route.match_value === undefined && !route.match_pattern) {
        return fieldValue !== undefined && fieldValue !== null;
      }

      if (route.match_value !== undefined) {
        if (String(fieldValue) !== String(route.match_value)) {
          return false;
        }
      }

      if (route.match_pattern) {
        const regex = this.getRegex(route.match_pattern);
        if (!regex || !regex.test(String(fieldValue ?? ''))) {
          return false;
        }
      }

      return true;
    }

    if (route.match_pattern) {
      const regex = this.getRegex(route.match_pattern);
      if (!regex) return false;
      const str = getPayloadString ? getPayloadString() : JSON.stringify(context.input.payload);
      return regex.test(str);
    }

    return false;
  }

  private evaluateConditions(route: Route, context: SimulationContext): boolean {
    const conditions = route.conditions!;
    const operator = route.conditionOperator || 'AND';

    const results = conditions.map((cond) => {
      let fieldValue: unknown;
      const type = cond.type || 'payload';

      if (type === 'header') {
        fieldValue = context.input.headers?.[cond.field];
      } else if (type === 'metadata') {
        fieldValue = context.input.metadata?.[cond.field];
      } else {
        fieldValue = this.getNestedValue(context.input.payload, cond.field);
      }

      switch (cond.operator) {
        case 'equals':
          return String(fieldValue) === String(cond.value);
        case 'contains':
          return String(fieldValue ?? '').includes(String(cond.value));
        case 'regex': {
          const regex = this.getRegex(cond.value || '');
          return regex ? regex.test(String(fieldValue ?? '')) : false;
        }
        case 'exists':
          return fieldValue !== undefined && fieldValue !== null;
        case 'gt':
          return Number(fieldValue) > Number(cond.value);
        case 'lt':
          return Number(fieldValue) < Number(cond.value);
        default:
          return false;
      }
    });

    return operator === 'OR' ? results.some(Boolean) : results.every(Boolean);
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path
      .split('.')
      .reduce<unknown>((current, key) => (current as Record<string, unknown>)?.[key], obj);
  }
}

// Singleton instance
export const routeMatcher = new RouteMatcher();
