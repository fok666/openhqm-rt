import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Custom test fixtures for OpenHQM Router Manager E2E tests
 * Provides common utilities and helpers for testing
 */

/**
 * Helper functions for E2E tests
 */
export class RouteManagerHelpers {
  constructor(private page: Page) {}

  /**
   * Navigate to the application
   */
  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for the application to be ready
   */
  async waitForAppReady() {
    await this.page.waitForSelector('[data-testid="app-container"]', {
      timeout: 10000,
    });
  }

  /**
   * Helper to select an option in MUI Select component
   */
  async selectMUIOption(selectDataTestId: string, optionValue: string) {
    // Click the select to open the dropdown
    await this.page.click(`[data-testid="${selectDataTestId}"]`);
    // Wait for menu to open and click the option
    await this.page.click(`li[data-value="${optionValue}"]`, { timeout: 2000 });
  }

  /**
   * Create a new route through the UI
   */
  async createRoute(routeName: string) {
    await this.page.click('[data-testid="new-route-button"]');
    await this.page.waitForSelector('[data-testid="route-editor"]');
    await this.page.fill('[data-testid="route-name-input"]', routeName);
  }

  /**
   * Fill in route conditions
   */
  async addCondition(field: string, operator: string, value: string) {
    await this.page.click('[data-testid="add-condition-button"]');
    await this.page.fill('[data-testid="condition-field-input"]', field);
    await this.selectMUIOption('condition-operator-select', operator);
    await this.page.fill('[data-testid="condition-value-input"]', value);
  }

  /**
   * Add JQ transform
   */
  async addTransform(jqExpression: string) {
    await this.page.click('[data-testid="enable-transform-toggle"]');
    await this.page.fill('[data-testid="jq-expression-editor"]', jqExpression);
  }

  /**
   * Save the current route
   */
  async saveRoute() {
    await this.page.click('[data-testid="save-route-button"]');
    await this.page.waitForSelector('[data-testid="save-success-message"]', {
      timeout: 5000,
    });
  }

  /**
   * Select a route from the list
   */
  async selectRoute(routeName: string) {
    await this.page.click(`[data-testid="route-item-${routeName}"]`);
  }

  /**
   * Delete a route
   */
  async deleteRoute(routeName: string) {
    await this.page.click(`[data-testid="route-item-${routeName}"] [data-testid="delete-button"]`);
    await this.page.click('[data-testid="confirm-delete-button"]');
  }

  /**
   * Open JQ Playground
   */
  async openJQPlayground() {
    await this.page.click('[data-testid="jq-playground-tab"]');
    await this.page.waitForSelector('[data-testid="jq-playground"]');
  }

  /**
   * Test JQ expression in playground
   */
  async testJQExpression(expression: string, input: any) {
    await this.page.fill('[data-testid="jq-input-editor"]', JSON.stringify(input, null, 2));
    await this.page.fill('[data-testid="jq-expression-editor"]', expression);
    await this.page.click('[data-testid="run-transform-button"]');
  }

  /**
   * Open Simulator
   */
  async openSimulator() {
    await this.page.click('[data-testid="simulator-tab"]');
    await this.page.waitForSelector('[data-testid="simulator"]');
  }

  /**
   * Run simulation
   */
  async runSimulation(payload: any) {
    await this.page.fill(
      '[data-testid="simulation-payload-editor"]',
      JSON.stringify(payload, null, 2)
    );
    await this.page.click('[data-testid="run-simulation-button"]');
    await this.page.waitForSelector('[data-testid="simulation-results"]', {
      timeout: 10000,
    });
  }

  /**
   * Export configuration as YAML
   */
  async exportConfigMap() {
    await this.page.click('[data-testid="export-button"]');
    await this.page.click('[data-testid="export-yaml-option"]');
  }

  /**
   * Import configuration
   */
  async importConfigMap(yamlContent: string) {
    await this.page.click('[data-testid="import-button"]');
    await this.page.fill('[data-testid="import-textarea"]', yamlContent);
    await this.page.click('[data-testid="import-confirm-button"]');
  }

  /**
   * Get text content of an element
   */
  async getText(selector: string): Promise<string> {
    return (await this.page.textContent(selector)) || '';
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    return await this.page.isVisible(selector);
  }

  /**
   * Wait for element
   */
  async waitForElement(selector: string, timeout = 5000) {
    await this.page.waitForSelector(selector, { timeout });
  }

  /**
   * Take screenshot
   */
  async screenshot(name: string) {
    await this.page.screenshot({
      path: `screenshots/${name}.png`,
      fullPage: true,
    });
  }
}

// Extended test object with custom fixtures
export const test = base.extend<{
  cleanLocalStorage: void;
  sampleRoute: any;
  samplePayload: any;
  helpers: RouteManagerHelpers;
}>({
  // Fixture to clean localStorage before each test
  cleanLocalStorage: [
    async ({ page }, use) => {
      await page.goto('/');
      await page.evaluate(() => localStorage.clear());
      await use();
    },
    { auto: true },
  ],

  // Helper functions fixture
  helpers: async ({ page }, use) => {
    const helpers = new RouteManagerHelpers(page);
    await use(helpers);
  },

  // Sample route for testing
  sampleRoute: {
    id: 'test-route-001',
    name: 'Test High Priority Route',
    description: 'Test route for E2E testing',
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
    transform: {
      enabled: true,
      jqExpression: '{ orderId: .order.id, priority: "HIGH" }',
      errorHandling: 'fail',
    },
    destination: {
      type: 'endpoint',
      target: 'order-service-high',
      endpoint: 'order-service-high',
    },
  },

  // Sample payload for testing
  samplePayload: {
    order: {
      id: 12345,
      priority: 'high',
      customer: {
        id: 'CUST-001',
        name: 'Test Customer',
      },
      items: [
        { sku: 'ITEM-001', quantity: 2 },
        { sku: 'ITEM-002', quantity: 1 },
      ],
    },
  },
});

export { expect };

/**
 * OpenHQM Example Data Fixtures
 * These fixtures contain sample data matching the OpenHQM examples
 * to ensure Router Manager can handle real-world OpenHQM configurations
 */

/**
 * Sample routing configuration matching openhqm/examples/routing-config.yaml
 */
export const OPENHQM_ROUTING_CONFIG = {
  version: '1.0',
  routes: [
    {
      name: 'user-registration',
      description: 'Route user registration requests to user service',
      match_field: 'metadata.type',
      match_value: 'user.register',
      priority: 10,
      endpoint: 'user-service',
      method: 'POST',
      transform_type: 'jq',
      transform: `{
  "username": .payload.email | split("@")[0],
  "email": .payload.email,
  "full_name": .payload.name,
  "metadata": {
    "source": "queue",
    "correlation_id": .correlation_id
  }
}`,
      header_mappings: {
        'X-Request-ID': 'correlation_id',
        'X-Source': 'metadata.source',
      },
      timeout: 30,
    },
    {
      name: 'order-processing',
      description: 'Process orders with item transformation',
      match_field: 'metadata.type',
      match_value: 'order.create',
      priority: 10,
      endpoint: 'order-service',
      method: 'POST',
      transform_type: 'jq',
      transform: `{
  "order_id": .payload.order_id,
  "customer_id": .payload.customer.id,
  "items": [.payload.items[] | {
    "product_id": .sku,
    "quantity": .qty,
    "price": .unit_price
  }],
  "total": (.payload.items | map(.qty * .unit_price) | add),
  "currency": .payload.currency // "USD"
}`,
      header_mappings: {
        'X-Order-ID': 'payload.order_id',
        'X-Customer-ID': 'payload.customer.id',
      },
    },
    {
      name: 'notification',
      description: 'Send notifications via notification service',
      match_field: 'metadata.type',
      match_pattern: '^notification\\.',
      priority: 5,
      endpoint: 'notification-service',
      transform_type: 'template',
      transform: `{
  "recipient": "{{payload.user.email}}",
  "subject": "{{payload.subject}}",
  "body": "{{payload.message}}",
  "template_id": "{{metadata.template}}",
  "metadata": {
    "correlation_id": "{{correlation_id}}"
  }
}`,
    },
    {
      name: 'analytics',
      description: 'Extract analytics data',
      match_field: 'metadata.type',
      match_value: 'analytics.track',
      priority: 5,
      endpoint: 'analytics-service',
      transform_type: 'jsonpath',
      transform: '$.payload.event',
      header_mappings: {
        'X-Event-Type': 'payload.event.type',
        'X-User-ID': 'payload.event.user_id',
      },
    },
    {
      name: 'legacy-app-session',
      description: 'Route to legacy app with session affinity',
      match_field: 'metadata.type',
      match_value: 'legacy.request',
      priority: 8,
      endpoint: 'legacy-service',
      method: 'POST',
      transform_type: 'passthrough',
      header_mappings: {
        'X-Session-ID': 'metadata.session_id',
        'X-User-ID': 'metadata.user_id',
      },
      timeout: 60,
      max_retries: 1,
    },
  ],
  default_endpoint: 'default-backend',
  enable_fallback: true,
};

/**
 * Sample payloads for testing OpenHQM routes
 */
export const OPENHQM_SAMPLE_PAYLOADS = {
  userRegistration: {
    payload: {
      email: 'john.doe@example.com',
      name: 'John Doe',
      password: 'secure-password',
    },
    metadata: {
      type: 'user.register',
      source: 'web-app',
      timestamp: '2024-02-08T10:00:00Z',
    },
    correlation_id: 'corr-user-001',
  },

  orderCreate: {
    payload: {
      order_id: 'ORD-2024-0001',
      customer: {
        id: 'CUST-12345',
        email: 'customer@example.com',
      },
      items: [
        { sku: 'LAPTOP-001', qty: 1, unit_price: 999.99 },
        { sku: 'MOUSE-002', qty: 2, unit_price: 25.50 },
      ],
      currency: 'USD',
    },
    metadata: {
      type: 'order.create',
      source: 'checkout',
    },
    correlation_id: 'corr-order-001',
  },

  notification: {
    payload: {
      user: {
        email: 'user@example.com',
        name: 'User Name',
      },
      subject: 'Order Confirmation',
      message: 'Your order has been confirmed',
    },
    metadata: {
      type: 'notification.email',
      template: 'order-confirmation',
    },
    correlation_id: 'corr-notif-001',
  },

  analytics: {
    payload: {
      event: {
        type: 'page_view',
        user_id: 'user-123',
        page: '/products/laptop',
        timestamp: '2024-02-08T10:00:00Z',
        properties: {
          referrer: 'google.com',
          device: 'desktop',
        },
      },
    },
    metadata: {
      type: 'analytics.track',
    },
    correlation_id: 'corr-analytics-001',
  },

  legacyRequest: {
    payload: {
      action: 'get_user_cart',
      user_id: 'user-456',
    },
    metadata: {
      type: 'legacy.request',
      session_id: 'sess-abc-123',
      user_id: 'user-456',
    },
    correlation_id: 'corr-legacy-001',
  },
};

/**
 * Expected transformation outputs for OpenHQM examples
 */
export const OPENHQM_EXPECTED_OUTPUTS = {
  userRegistration: {
    username: 'john.doe',
    email: 'john.doe@example.com',
    full_name: 'John Doe',
    metadata: {
      source: 'queue',
      correlation_id: 'corr-user-001',
    },
  },

  orderCreate: {
    order_id: 'ORD-2024-0001',
    customer_id: 'CUST-12345',
    items: [
      { product_id: 'LAPTOP-001', quantity: 1, price: 999.99 },
      { product_id: 'MOUSE-002', quantity: 2, price: 25.50 },
    ],
    total: 1051.49,
    currency: 'USD',
  },
};

/**
 * Kubernetes ConfigMap template matching OpenHQM format
 */
export const OPENHQM_CONFIGMAP_TEMPLATE = {
  apiVersion: 'v1',
  kind: 'ConfigMap',
  metadata: {
    name: 'openhqm-routes',
    namespace: 'openhqm',
    labels: {
      app: 'openhqm',
      component: 'router',
      'app.kubernetes.io/name': 'openhqm',
      'app.kubernetes.io/component': 'routing-config',
    },
    annotations: {
      'openhqm.io/version': '1.0',
      'openhqm.io/managed-by': 'openhqm-router-manager',
    },
  },
};
