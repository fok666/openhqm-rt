import type { Route, RouteCondition, SimulationContext } from '../types';
import { jqService } from './jqEngine';

export class RouteMatcher {
  async matchRoute(routes: Route[], context: SimulationContext): Promise<Route | null> {
    // Sort by priority (higher first)
    const sortedRoutes = routes.filter((r) => r.enabled).sort((a, b) => b.priority - a.priority);

    for (const route of sortedRoutes) {
      if (await this.evaluateConditions(route, context)) {
        return route;
      }
    }

    return null;
  }

  async evaluateConditions(route: Route, context: SimulationContext): Promise<boolean> {
    if (route.conditions.length === 0) {
      return true; // No conditions means always match
    }

    const results = await Promise.all(
      route.conditions.map((c) => this.evaluateCondition(c, context))
    );

    if (route.conditionOperator === 'AND') {
      return results.every((r) => r);
    } else {
      return results.some((r) => r);
    }
  }

  private async evaluateCondition(
    condition: RouteCondition,
    context: SimulationContext
  ): Promise<boolean> {
    switch (condition.type) {
      case 'jq':
        return this.evaluateJQCondition(condition, context);
      case 'payload':
        return this.evaluatePayloadCondition(condition, context);
      case 'header':
        return this.evaluateHeaderCondition(condition, context);
      case 'metadata':
        return this.evaluateMetadataCondition(condition, context);
      default:
        return false;
    }
  }

  private async evaluateJQCondition(
    condition: RouteCondition,
    context: SimulationContext
  ): Promise<boolean> {
    if (!condition.jqExpression) return false;

    try {
      const result = await jqService.transform(condition.jqExpression, context.input.payload);
      return result.success && Boolean(result.output);
    } catch (error) {
      console.error('JQ condition evaluation error:', error);
      return false;
    }
  }

  private evaluatePayloadCondition(condition: RouteCondition, context: SimulationContext): boolean {
    if (!condition.field) return false;
    const value = this.getNestedValue(context.input.payload, condition.field);
    return this.compareValues(value, condition.operator, condition.value);
  }

  private evaluateHeaderCondition(condition: RouteCondition, context: SimulationContext): boolean {
    if (!condition.field) return false;
    const value = context.input.headers[condition.field];
    return this.compareValues(value, condition.operator, condition.value);
  }

  private evaluateMetadataCondition(
    condition: RouteCondition,
    context: SimulationContext
  ): boolean {
    if (!condition.field) return false;
    const value = context.input.metadata[condition.field];
    return this.compareValues(value, condition.operator, condition.value);
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected;
      case 'contains':
        return String(actual).includes(String(expected));
      case 'regex':
        try {
          return new RegExp(expected).test(String(actual));
        } catch {
          return false;
        }
      case 'exists':
        return actual !== undefined && actual !== null;
      default:
        return false;
    }
  }
}

// Singleton instance
export const routeMatcher = new RouteMatcher();
