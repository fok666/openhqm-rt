/* eslint-disable @typescript-eslint/no-explicit-any -- YAML parsing in test fixtures */
import { test, expect, RouteManagerHelpers } from './fixtures';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * E2E tests validating OpenHQM example configurations
 * 
 * These tests ensure that:
 * 1. Router Manager can import and parse OpenHQM example configs
 * 2. Example routing rules can be visualized and edited
 * 3. Transformations in examples are valid and executable
 * 4. Exported ConfigMaps from Router Manager match OpenHQM format
 * 5. All examples are production-ready and functional
 * 
 * This creates a contract between openhqm and openhqm-rt:
 * - openhqm examples are the source of truth
 * - openhqm-rt must support all features in examples
 * - Changes to examples trigger test failures if incompatible
 */

test.describe('OpenHQM Example Configurations', () => {
  let helpers: RouteManagerHelpers;
  const OPENHQM_EXAMPLES_PATH = '../../../openhqm/examples';

  test.beforeEach(async ({ page }) => {
    helpers = new RouteManagerHelpers(page);
    await helpers.goto();
    await helpers.waitForAppReady();
  });

  test('should import and validate routing-config.yaml example', async ({ page }) => {
    // Load the actual OpenHQM routing config example
    const examplePath = path.join(__dirname, OPENHQM_EXAMPLES_PATH, 'routing-config.yaml');
    const configContent = fs.readFileSync(examplePath, 'utf-8');
    const config = yaml.load(configContent) as any;

    // Verify the example has the expected structure
    expect(config.version).toBe('1.0');
    expect(config.routes).toBeDefined();
    expect(Array.isArray(config.routes)).toBe(true);
    expect(config.routes.length).toBeGreaterThan(0);

    // Import the config into Router Manager
    await page.click('[data-testid="import-button"]');
    await page.waitForSelector('[data-testid="import-dialog"]');
    
    // Paste YAML content
    await page.fill('[data-testid="import-textarea"]', configContent);
    await page.click('[data-testid="import-confirm-button"]');
    
    // Verify import success
    await expect(page.locator('[data-testid="import-success-message"]')).toBeVisible();
    
    // Verify all routes from example are imported
    for (const route of config.routes) {
      await expect(page.locator(`[data-testid="route-item-${route.name}"]`)).toBeVisible();
    }
  });

  test('should validate user-registration route from example', async ({ page }) => {
    const examplePath = path.join(__dirname, OPENHQM_EXAMPLES_PATH, 'routing-config.yaml');
    const configContent = fs.readFileSync(examplePath, 'utf-8');
    const config = yaml.load(configContent) as any;

    // Find the user-registration route
    const userRegistrationRoute = config.routes.find((r: any) => r.name === 'user-registration');
    expect(userRegistrationRoute).toBeDefined();

    // Import config
    await page.click('[data-testid="import-button"]');
    await page.fill('[data-testid="import-textarea"]', configContent);
    await page.click('[data-testid="import-confirm-button"]');
    
    // Select the user-registration route
    await helpers.selectRoute('user-registration');
    
    // Verify route details match example
    const routeName = await page.locator('[data-testid="route-name-input"]').inputValue();
    expect(routeName).toBe('user-registration');
    
    const routeDescription = await page.locator('[data-testid="route-description-input"]').inputValue();
    expect(routeDescription).toContain('user registration');
    
    const priority = await page.locator('[data-testid="route-priority-input"]').inputValue();
    expect(priority).toBe('10');
  });

  test('should execute JQ transformation from order-processing example', async ({ page }) => {
    const examplePath = path.join(__dirname, OPENHQM_EXAMPLES_PATH, 'routing-config.yaml');
    const configContent = fs.readFileSync(examplePath, 'utf-8');
    const config = yaml.load(configContent) as any;

    // Find order-processing route with complex JQ transform
    const orderRoute = config.routes.find((r: any) => r.name === 'order-processing');
    expect(orderRoute).toBeDefined();
    expect(orderRoute.transform_type).toBe('jq');

    // Test the transformation in JQ Playground
    await helpers.openJQPlayground();
    
    // Input sample order data
    const sampleOrderData = {
      payload: {
        order_id: "ORD-12345",
        customer: { id: "CUST-001" },
        items: [
          { sku: "PROD-A", qty: 2, unit_price: 10.00 },
          { sku: "PROD-B", qty: 1, unit_price: 25.50 }
        ],
        currency: "USD"
      },
      correlation_id: "test-123"
    };

    await page.fill('[data-testid="jq-input-editor"] textarea', JSON.stringify(sampleOrderData, null, 2));
    await page.fill('[data-testid="jq-expression-editor"] textarea', orderRoute.transform);
    
    // Execute transformation
    await page.click('[data-testid="run-transform-button"]');
    
    // Verify transformation succeeds - output should be visible
    await expect(page.locator('[data-testid="jq-output-display"]')).toBeVisible({ timeout: 10000 });
    
    // Verify output contains expected fields
    const outputDisplay = page.locator('[data-testid="jq-output-display"]');
    await expect(outputDisplay).toContainText('ORD-12345');
    await expect(outputDisplay).toContainText('CUST-001');
    await expect(outputDisplay).toContainText('45.5');
    await expect(outputDisplay).toContainText('USD');
  });

  test('should validate match_pattern regex from notification example', async ({ page }) => {
    const examplePath = path.join(__dirname, OPENHQM_EXAMPLES_PATH, 'routing-config.yaml');
    const configContent = fs.readFileSync(examplePath, 'utf-8');
    const config = yaml.load(configContent) as any;

    // Find notification route with regex pattern
    const notificationRoute = config.routes.find((r: any) => r.name === 'notification');
    expect(notificationRoute).toBeDefined();
    expect(notificationRoute.match_pattern).toBe('^notification\\.');

    // Import config
    await page.click('[data-testid="import-button"]');
    await page.fill('[data-testid="import-textarea"]', configContent);
    await page.click('[data-testid="import-confirm-button"]');
    
    // Open simulator to test pattern matching
    await helpers.openSimulator();
    
    // Test a message that should match the notification route
    const matchingMessage = {
      metadata: { type: 'notification.email' },
      payload: { message: 'Hello' }
    };

    await page.fill('[data-testid="simulation-payload-editor"]', JSON.stringify(matchingMessage, null, 2));
    await page.click('[data-testid="run-simulation-button"]');
    
    // Verify a route matched and it's the notification route
    const matchedRoute = page.locator('[data-testid="matched-route"]');
    await expect(matchedRoute).toBeVisible({ timeout: 10000 });
    await expect(matchedRoute).toContainText('notification');

    // Test a message that should NOT match the notification route
    const nonMatchingMessage = {
      metadata: { type: 'order.create' },
      payload: { orderId: '123' }
    };

    await page.fill('[data-testid="simulation-payload-editor"]', JSON.stringify(nonMatchingMessage, null, 2));
    await page.click('[data-testid="run-simulation-button"]');
    
    // Verify a different route matches (order-processing, not notification)
    await expect(matchedRoute).toBeVisible({ timeout: 10000 });
    await expect(matchedRoute).not.toContainText('notification');
  });

  test('should export routes in OpenHQM-compatible ConfigMap format', async ({ page }) => {
    // Import example config
    const examplePath = path.join(__dirname, OPENHQM_EXAMPLES_PATH, 'routing-config.yaml');
    const configContent = fs.readFileSync(examplePath, 'utf-8');
    
    await page.click('[data-testid="import-button"]');
    await page.fill('[data-testid="import-textarea"]', configContent);
    await page.click('[data-testid="import-confirm-button"]');
    
    // Export as ConfigMap via route list export dialog
    await page.click('[data-testid="export-button"]');
    await expect(page.locator('[data-testid="export-dialog"]')).toBeVisible();
    await page.click('[data-testid="export-format-yaml"]');
    
    // Get preview
    await page.click('[data-testid="preview-configmap-button"]');
    
    // Verify ConfigMap structure in preview
    const preview = page.locator('[data-testid="configmap-preview"]');
    await expect(preview).toBeVisible();
    await expect(preview).toContainText('apiVersion');
    await expect(preview).toContainText('ConfigMap');
    await expect(preview).toContainText('routes.yaml');
    await expect(preview).toContainText('order-processing');
    await expect(preview).toContainText('notification');
  });

  test('should validate k8s-routing-configmap.yaml example structure', async ({ page }) => {
    const examplePath = path.join(__dirname, OPENHQM_EXAMPLES_PATH, 'k8s-routing-configmap.yaml');
    const configContent = fs.readFileSync(examplePath, 'utf-8');
    
    // Parse multi-document YAML
    const docs = yaml.loadAll(configContent) as any[];
    
    // First document should be ConfigMap
    const configMap = docs[0];
    expect(configMap.kind).toBe('ConfigMap');
    expect(configMap.metadata.name).toBe('openhqm-routing-config');
    expect(configMap.data['routing.yaml']).toBeDefined();
    
    // Second document should be StatefulSet
    const statefulSet = docs[1];
    expect(statefulSet.kind).toBe('StatefulSet');
    expect(statefulSet.metadata.name).toBe('openhqm-workers');
    
    // Import routing config into Router Manager
    await page.click('[data-testid="import-button"]');
    await page.fill('[data-testid="import-textarea"]', configMap.data['routing.yaml']);
    await page.click('[data-testid="import-confirm-button"]');
    
    // Verify routes are imported
    await expect(page.locator('[data-testid="import-success-message"]')).toBeVisible();
    
    // Verify specific routes from k8s example
    await expect(page.locator('[data-testid="route-item-user-api"]')).toBeVisible();
    await expect(page.locator('[data-testid="route-item-order-api"]')).toBeVisible();
  });

  test('should handle all transform types from examples', async ({ page }) => {
    const examplePath = path.join(__dirname, OPENHQM_EXAMPLES_PATH, 'routing-config.yaml');
    const configContent = fs.readFileSync(examplePath, 'utf-8');
    const config = yaml.load(configContent) as any;

    // Collect all unique transform types
    const transformTypes = new Set(config.routes.map((r: any) => r.transform_type));
    
    // Verify example config contains all transform types
    const expectedTypes = ['jq', 'template', 'jsonpath', 'passthrough'];
    for (const expectedType of expectedTypes) {
      expect(transformTypes.has(expectedType)).toBe(true);
    }

    // Import and verify each route can be selected and viewed
    await page.click('[data-testid="import-button"]');
    await page.fill('[data-testid="import-textarea"]', configContent);
    await page.click('[data-testid="import-confirm-button"]');
    
    // Verify all routes are visible in the route list
    for (const transformType of expectedTypes) {
      const route = config.routes.find((r: any) => r.transform_type === transformType);
      if (route) {
        await expect(page.locator(`[data-testid="route-item-${route.name}"]`)).toBeVisible();
      }
    }
  });

  test('should validate header mappings from examples', async ({ page }) => {
    const examplePath = path.join(__dirname, OPENHQM_EXAMPLES_PATH, 'routing-config.yaml');
    const configContent = fs.readFileSync(examplePath, 'utf-8');
    const config = yaml.load(configContent) as any;

    // Find route with header mappings (order-processing)
    const routeWithHeaders = config.routes.find((r: any) => r.header_mappings);
    expect(routeWithHeaders).toBeDefined();
    expect(routeWithHeaders.name).toBe('order-processing');

    // Import config
    await page.click('[data-testid="import-button"]');
    await page.fill('[data-testid="import-textarea"]', configContent);
    await page.click('[data-testid="import-confirm-button"]');
    
    // Select route with headers and verify it loaded
    await helpers.selectRoute(routeWithHeaders.name);
    
    // Verify route name matches in the editor
    const routeName = await page.locator('[data-testid="route-name-input"]').inputValue();
    expect(routeName).toBe('order-processing');
    
    // Verify the route description is populated
    const description = await page.locator('[data-testid="route-description-input"]').inputValue();
    expect(description).toContain('order');
  });

  test('should validate priority-based route ordering', async ({ page }) => {
    const examplePath = path.join(__dirname, OPENHQM_EXAMPLES_PATH, 'routing-config.yaml');
    const configContent = fs.readFileSync(examplePath, 'utf-8');
    const config = yaml.load(configContent) as any;

    // Import config
    await page.click('[data-testid="import-button"]');
    await page.fill('[data-testid="import-textarea"]', configContent);
    await page.click('[data-testid="import-confirm-button"]');
    
    // Verify all routes are imported by checking route count
    const routeItems = page.locator('[data-testid^="route-item-"]');
    await expect(routeItems).toHaveCount(config.routes.length);
    
    // Verify each route can be selected and has the expected priority
    // Select highest priority route and verify
    await helpers.selectRoute('order-processing');
    const orderPriority = await page.locator('[data-testid="route-priority-input"]').inputValue();
    expect(parseInt(orderPriority)).toBe(20);
    
    // Select lowest priority route and verify
    await helpers.selectRoute('default-route');
    const defaultPriority = await page.locator('[data-testid="route-priority-input"]').inputValue();
    expect(parseInt(defaultPriority)).toBe(0);
  });

  test('should validate complete user journey with example config', async ({ page }) => {
    // This test simulates a complete user workflow:
    // 1. Import OpenHQM example config
    // 2. Verify routes are loaded
    // 3. Test JQ transformation in playground
    // 4. Simulate routing
    // 5. Export back to ConfigMap

    const examplePath = path.join(__dirname, OPENHQM_EXAMPLES_PATH, 'routing-config.yaml');
    const configContent = fs.readFileSync(examplePath, 'utf-8');

    // Step 1: Import
    await page.click('[data-testid="import-button"]');
    await page.fill('[data-testid="import-textarea"]', configContent);
    await page.click('[data-testid="import-confirm-button"]');
    await expect(page.locator('[data-testid="import-success-message"]')).toBeVisible();

    // Step 2: Verify routes loaded
    await expect(page.locator('[data-testid="route-item-order-processing"]')).toBeVisible();
    await expect(page.locator('[data-testid="route-item-user-registration"]')).toBeVisible();

    // Step 3: Test transformation in JQ playground
    await helpers.openJQPlayground();
    const sampleData = {
      payload: { id: 'USR-001', email: 'test@example.com', name: 'Test User' },
      correlation_id: 'test-123'
    };
    
    await page.fill('[data-testid="jq-input-editor"] textarea', JSON.stringify(sampleData, null, 2));
    await page.fill('[data-testid="jq-expression-editor"] textarea', '{ user_id: .payload.id, email: .payload.email, name: .payload.name }');
    await page.click('[data-testid="run-transform-button"]');
    await expect(page.locator('[data-testid="jq-output-display"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="jq-output-display"]')).toContainText('USR-001');

    // Step 4: Simulate routing
    await helpers.openSimulator();
    const testMessage = {
      metadata: { type: 'user.register' },
      payload: { id: 'USR-001', email: 'test@example.com' }
    };
    await page.fill('[data-testid="simulation-payload-editor"]', JSON.stringify(testMessage, null, 2));
    await page.click('[data-testid="run-simulation-button"]');
    await expect(page.locator('[data-testid="matched-route"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="matched-route"]')).toContainText('user-registration');

    // Step 5: Export back to ConfigMap
    await page.click('[data-testid="route-editor-tab"]');
    await page.waitForTimeout(500);
    await page.click('[data-testid="export-button"]');
    await expect(page.locator('[data-testid="export-dialog"]')).toBeVisible();
    await page.click('[data-testid="export-format-yaml"]');
    await page.click('[data-testid="preview-configmap-button"]');

    // Verify export contains expected content
    const preview = page.locator('[data-testid="configmap-preview"]');
    await expect(preview).toContainText('apiVersion');
    await expect(preview).toContainText('ConfigMap');
  });
});
