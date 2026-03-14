import { test, expect, RouteManagerHelpers } from './fixtures';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

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
 * This creates a contract between openhqm and openhqm-rm:
 * - openhqm examples are the source of truth
 * - openhqm-rm must support all features in examples
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
    await page.click('[data-testid="import-submit-button"]');
    
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
    await page.click('[data-testid="import-submit-button"]');
    
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

    await page.fill('[data-testid="jq-input-editor"]', JSON.stringify(sampleOrderData, null, 2));
    await page.fill('[data-testid="jq-expression-editor"]', orderRoute.transform);
    
    // Execute transformation
    await page.click('[data-testid="jq-execute-button"]');
    
    // Verify transformation succeeds
    await expect(page.locator('[data-testid="jq-output-success"]')).toBeVisible();
    
    // Verify output structure
    const outputText = await page.locator('[data-testid="jq-output-editor"]').textContent();
    const output = JSON.parse(outputText || '{}');
    
    expect(output.order_id).toBe("ORD-12345");
    expect(output.customer_id).toBe("CUST-001");
    expect(output.items).toHaveLength(2);
    expect(output.total).toBe(45.50); // 2*10 + 1*25.50
    expect(output.currency).toBe("USD");
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
    await page.click('[data-testid="import-submit-button"]');
    
    // Open simulator to test pattern matching
    await page.click('[data-testid="simulator-tab"]');
    
    // Test messages that should match
    const matchingMessages = [
      { metadata: { type: 'notification.email' } },
      { metadata: { type: 'notification.sms' } },
      { metadata: { type: 'notification.push' } }
    ];

    for (const msg of matchingMessages) {
      await page.fill('[data-testid="simulator-input"]', JSON.stringify(msg, null, 2));
      await page.click('[data-testid="simulator-run-button"]');
      
      // Verify notification route matches
      await expect(page.locator('[data-testid="matched-route-notification"]')).toBeVisible();
    }

    // Test messages that should NOT match
    const nonMatchingMessages = [
      { metadata: { type: 'order.create' } },
      { metadata: { type: 'user.register' } }
    ];

    for (const msg of nonMatchingMessages) {
      await page.fill('[data-testid="simulator-input"]', JSON.stringify(msg, null, 2));
      await page.click('[data-testid="simulator-run-button"]');
      
      // Verify notification route does NOT match
      await expect(page.locator('[data-testid="matched-route-notification"]')).not.toBeVisible();
    }
  });

  test('should export routes in OpenHQM-compatible ConfigMap format', async ({ page }) => {
    // Import example config
    const examplePath = path.join(__dirname, OPENHQM_EXAMPLES_PATH, 'routing-config.yaml');
    const configContent = fs.readFileSync(examplePath, 'utf-8');
    
    await page.click('[data-testid="import-button"]');
    await page.fill('[data-testid="import-textarea"]', configContent);
    await page.click('[data-testid="import-submit-button"]');
    
    // Export as ConfigMap
    await page.click('[data-testid="export-button"]');
    await page.click('[data-testid="export-format-yaml"]');
    
    // Get preview
    await page.click('[data-testid="preview-configmap-button"]');
    const previewText = await page.locator('[data-testid="configmap-preview"]').textContent();
    
    // Parse exported ConfigMap
    const exportedConfigMap = yaml.load(previewText || '') as any;
    
    // Verify ConfigMap structure matches OpenHQM requirements
    expect(exportedConfigMap.apiVersion).toBe('v1');
    expect(exportedConfigMap.kind).toBe('ConfigMap');
    expect(exportedConfigMap.metadata.name).toBeDefined();
    expect(exportedConfigMap.data).toBeDefined();
    expect(exportedConfigMap.data['routing.yaml']).toBeDefined();
    
    // Parse embedded routing config
    const routingConfig = yaml.load(exportedConfigMap.data['routing.yaml']) as any;
    expect(routingConfig.version).toBe('1.0');
    expect(routingConfig.routes).toBeDefined();
    expect(Array.isArray(routingConfig.routes)).toBe(true);
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
    await page.click('[data-testid="import-submit-button"]');
    
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
    
    // Verify Router Manager supports all transform types
    const expectedTypes = ['jq', 'template', 'jsonpath', 'passthrough'];
    for (const expectedType of expectedTypes) {
      expect(transformTypes.has(expectedType)).toBe(true);
    }

    // Import and verify each type can be edited
    await page.click('[data-testid="import-button"]');
    await page.fill('[data-testid="import-textarea"]', configContent);
    await page.click('[data-testid="import-submit-button"]');
    
    for (const transformType of expectedTypes) {
      const route = config.routes.find((r: any) => r.transform_type === transformType);
      if (route) {
        await helpers.selectRoute(route.name);
        
        // Verify transform type is displayed correctly
        const displayedType = await page.locator('[data-testid="transform-type-display"]').textContent();
        expect(displayedType?.toLowerCase()).toContain(transformType);
      }
    }
  });

  test('should validate header mappings from examples', async ({ page }) => {
    const examplePath = path.join(__dirname, OPENHQM_EXAMPLES_PATH, 'routing-config.yaml');
    const configContent = fs.readFileSync(examplePath, 'utf-8');
    const config = yaml.load(configContent) as any;

    // Find route with header mappings
    const routeWithHeaders = config.routes.find((r: any) => r.header_mappings);
    expect(routeWithHeaders).toBeDefined();

    // Import config
    await page.click('[data-testid="import-button"]');
    await page.fill('[data-testid="import-textarea"]', configContent);
    await page.click('[data-testid="import-submit-button"]');
    
    // Select route with headers
    await helpers.selectRoute(routeWithHeaders.name);
    
    // Verify header mappings are imported
    const headerMappings = routeWithHeaders.header_mappings;
    for (const [headerName] of Object.entries(headerMappings)) {
      // Check that header mapping is visible in UI
      await expect(page.locator(`[data-testid="header-mapping-${headerName}"]`)).toBeVisible();
    }
  });

  test('should validate priority-based route ordering', async ({ page }) => {
    const examplePath = path.join(__dirname, OPENHQM_EXAMPLES_PATH, 'routing-config.yaml');
    const configContent = fs.readFileSync(examplePath, 'utf-8');

    // Import config
    await page.click('[data-testid="import-button"]');
    await page.fill('[data-testid="import-textarea"]', configContent);
    await page.click('[data-testid="import-submit-button"]');
    
    // Get all route items
    const routeItems = page.locator('[data-testid^="route-item-"]');
    const count = await routeItems.count();
    
    // Verify routes are ordered by priority (highest first)
    const priorities: number[] = [];
    for (let i = 0; i < count; i++) {
      const routeItem = routeItems.nth(i);
      const priorityText = await routeItem.locator('[data-testid="route-priority"]').textContent();
      priorities.push(parseInt(priorityText || '0'));
    }
    
    // Check descending order
    for (let i = 0; i < priorities.length - 1; i++) {
      expect(priorities[i]).toBeGreaterThanOrEqual(priorities[i + 1]);
    }
  });

  test('should validate complete user journey with example config', async ({ page }) => {
    // This test simulates a complete user workflow:
    // 1. Import OpenHQM example config
    // 2. Modify a route
    // 3. Test transformation
    // 4. Simulate routing
    // 5. Export back to ConfigMap
    // 6. Verify exported config is valid for OpenHQM

    const examplePath = path.join(__dirname, OPENHQM_EXAMPLES_PATH, 'routing-config.yaml');
    const configContent = fs.readFileSync(examplePath, 'utf-8');

    // Step 1: Import
    await page.click('[data-testid="import-button"]');
    await page.fill('[data-testid="import-textarea"]', configContent);
    await page.click('[data-testid="import-submit-button"]');
    await expect(page.locator('[data-testid="import-success-message"]')).toBeVisible();

    // Step 2: Select and modify a route
    await helpers.selectRoute('user-registration');
    await page.fill('[data-testid="route-description-input"]', 'Modified: User registration route');
    await helpers.saveRoute();

    // Step 3: Test transformation in playground
    await helpers.openJQPlayground();
    const sampleData = {
      payload: {
        email: 'test@example.com',
        name: 'Test User'
      },
      correlation_id: 'test-123'
    };
    
    await page.fill('[data-testid="jq-input-editor"]', JSON.stringify(sampleData, null, 2));
    await page.click('[data-testid="jq-execute-button"]');
    await expect(page.locator('[data-testid="jq-output-success"]')).toBeVisible();

    // Step 4: Simulate routing
    await page.click('[data-testid="simulator-tab"]');
    const testMessage = { metadata: { type: 'user.register' }, payload: sampleData.payload };
    await page.fill('[data-testid="simulator-input"]', JSON.stringify(testMessage, null, 2));
    await page.click('[data-testid="simulator-run-button"]');
    await expect(page.locator('[data-testid="matched-route-user-registration"]')).toBeVisible();

    // Step 5: Export
    await page.click('[data-testid="routes-tab"]');
    await page.click('[data-testid="export-button"]');
    await page.click('[data-testid="preview-configmap-button"]');
    
    const exportedText = await page.locator('[data-testid="configmap-preview"]').textContent();
    const exportedConfigMap = yaml.load(exportedText || '') as any;

    // Step 6: Verify exported config
    expect(exportedConfigMap.kind).toBe('ConfigMap');
    const routingConfig = yaml.load(exportedConfigMap.data['routing.yaml']) as any;
    expect(routingConfig.version).toBe('1.0');
    expect(routingConfig.routes.length).toBeGreaterThan(0);
    
    // Verify modified route is in export
    const modifiedRoute = routingConfig.routes.find((r: any) => r.name === 'user-registration');
    expect(modifiedRoute.description).toContain('Modified');
  });
});
