/**
 * OpenHQM Routing Configuration Types
 * Matches the openhqm routing schema
 */

/**
 * Top-level routing configuration
 */
export interface RoutingConfig {
  version: string;
  routes: Route[];
  default_endpoint?: string;
  enable_fallback?: boolean;
}

/**
 * Route condition for complex matching
 */
export interface RouteCondition {
  type?: 'payload' | 'header' | 'metadata';
  field: string;
  operator: string;
  value?: string;
}

/**
 * Individual route definition
 * Matches openhqm route schema
 */
export interface Route {
  // Identification
  name: string;
  description?: string;
  enabled?: boolean; // defaults to true
  priority?: number; // defaults to 100
  is_default?: boolean;

  // Matching conditions
  match_field?: string;
  match_value?: string;
  match_pattern?: string;
  conditions?: RouteCondition[];
  conditionOperator?: 'AND' | 'OR';

  // Destination
  endpoint: string;
  method?: string; // defaults to POST

  // Transformation
  transform_type?: 'jq' | 'template' | 'jsonpath' | 'passthrough';
  transform?: string;

  // Mappings
  header_mappings?: Record<string, string>;
  query_params?: Record<string, string>;

  // Settings
  timeout?: number;
  max_retries?: number;

  // Actions
  actions?: RouteAction[];
}

export interface RouteAction {
  type: string;
  [key: string]: string;
}

/**
 * Legacy interface for backward compatibility
 * Will be deprecated in favor of RoutingConfig
 */
export interface RouteConfig {
  version: string;
  routes: Route[];
  default_endpoint?: string;
  enable_fallback?: boolean;
}
