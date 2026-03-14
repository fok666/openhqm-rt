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
