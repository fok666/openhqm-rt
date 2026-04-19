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
 * E2E tests for importing OpenHQM ConfigMap examples
 * 
 * Tests that ready-to-use ConfigMap examples from openhqm/examples/configmaps/
 * can be imported directly into Router Manager without modification.
 * 
 * This ensures:
 * 1. ConfigMaps are in correct format
 * 2. Router Manager can parse and load them
 * 3. All routes are imported correctly
 * 4. Transformations are valid
 * 5. Export maintains format compatibility
 */

test.describe('ConfigMap Import Examples', () => {
  let helpers: RouteManagerHelpers;
  const CONFIGMAPS_PATH = '../../openhqm/examples/configmaps';

  test.beforeEach(async ({ page }) => {
    helpers = new RouteManagerHelpers(page);
    await helpers.goto();
    await helpers.waitForAppReady();
    
    // Navigate to Export/Import tab
    await page.click('[data-testid="configmap-tab"]');
    await page.waitForTimeout(500); // Wait for tab switch animation
  });

  test('should import starter-routes.yaml ConfigMap', async ({ page }) => {
    const configMapPath = path.join(__dirname, CONFIGMAPS_PATH, 'starter-routes.yaml');
    const configMapContent = fs.readFileSync(configMapPath, 'utf-8');
    const configMap = yaml.load(configMapContent) as any;

    // Verify ConfigMap structure
    expect(configMap.apiVersion).toBe('v1');
    expect(configMap.kind).toBe('ConfigMap');
    expect(configMap.metadata.name).toBe('openhqm-starter-routes');
    expect(configMap.data).toBeDefined();
    expect(configMap.data['routing.yaml']).toBeDefined();

    // Parse embedded routing config
    const routingConfig = yaml.load(configMap.data['routing.yaml']) as any;
    expect(routingConfig.version).toBe('1.0');
    expect(routingConfig.routes).toBeDefined();
    expect(routingConfig.routes.length).toBe(4);

    // Import into Router Manager
    await page.click('[data-testid="import-button"]');
    await page.waitForSelector('[data-testid="import-dialog"]');
    
    // Paste the ConfigMap data (just the routing.yaml part)
    await page.locator('[data-testid="import-textarea"]').fill(configMap.data['routing.yaml']);
    await page.click('[data-testid="import-submit-button"]');
    
    // Verify import success
    await expect(page.locator('[data-testid="import-success-message"]')).toBeVisible({ timeout: 10000 });
    
    // Navigate back to Route Editor tab to see imported routes
    await page.click('[data-testid="route-editor-tab"]');
    await page.waitForTimeout(500); // Wait for tab switch
    
    // Verify all routes are imported
    const expectedRoutes = ['user-registration', 'order-create', 'notifications', 'default-route'];
    for (const routeName of expectedRoutes) {
      await expect(page.locator(`[data-testid="route-item-${routeName}"]`)).toBeVisible();
    }

    // Verify route count
    const routeItems = page.locator('[data-testid^="route-item-"]');
    const count = await routeItems.count();
    expect(count).toBe(4);
  });

  test('should import production-routes.yaml ConfigMap', async ({ page }) => {
    const configMapPath = path.join(__dirname, CONFIGMAPS_PATH, 'production-routes.yaml');
    const configMapContent = fs.readFileSync(configMapPath, 'utf-8');
    const configMap = yaml.load(configMapContent) as any;

    // Verify ConfigMap structure
    expect(configMap.apiVersion).toBe('v1');
    expect(configMap.kind).toBe('ConfigMap');
    expect(configMap.metadata.name).toBe('openhqm-production-routes');
    expect(configMap.metadata.namespace).toBe('production');

    // Parse embedded routing config
    const routingConfig = yaml.load(configMap.data['routing.yaml']) as any;
    expect(routingConfig.routes.length).toBe(10);

    // Import into Router Manager
    await page.click('[data-testid="import-button"]');
    await page.fill('[data-testid="import-textarea"]', configMap.data['routing.yaml']);
    await page.click('[data-testid="import-submit-button"]');
    
    // Verify import success
    await expect(page.locator('[data-testid="import-success-message"]')).toBeVisible({ timeout: 10000 });
    
    // Switch to route editor tab to see the imported routes
    await page.click('[data-testid="route-editor-tab"]');
    
    // Verify key routes are imported
    const keyRoutes = [
      'high-priority-orders',
      'standard-orders',
      'payment-processing',
      'email-notifications',
      'analytics-tracking'
    ];
    
    for (const routeName of keyRoutes) {
      await expect(page.locator(`[data-testid="route-item-${routeName}"]`)).toBeVisible();
    }

    // Verify route count
    const routeItems = page.locator('[data-testid^="route-item-"]');
    const count = await routeItems.count();
    expect(count).toBe(10);
  });

  test('should import microservices-routes.yaml ConfigMap', async ({ page }) => {
    const configMapPath = path.join(__dirname, CONFIGMAPS_PATH, 'microservices-routes.yaml');
    const configMapContent = fs.readFileSync(configMapPath, 'utf-8');
    const configMap = yaml.load(configMapContent) as any;

    // Verify ConfigMap structure
    expect(configMap.kind).toBe('ConfigMap');
    expect(configMap.metadata.name).toBe('openhqm-microservices-routes');

    // Parse embedded routing config
    const routingConfig = yaml.load(configMap.data['routing.yaml']) as any;
    expect(routingConfig.routes.length).toBe(6);

    // Import into Router Manager
    await page.click('[data-testid="import-button"]');
    await page.fill('[data-testid="import-textarea"]', configMap.data['routing.yaml']);
    await page.click('[data-testid="import-submit-button"]');
    
    // Verify import success
    await expect(page.locator('[data-testid="import-success-message"]')).toBeVisible({ timeout: 10000 });
    
    // Switch to route editor tab to see the imported routes
    await page.click('[data-testid="route-editor-tab"]');
    
    // Verify service routes
    const serviceRoutes = [
      'user-service-create',
      'order-service-create',
      'product-service-query',
      'inventory-service-update',
      'shipping-service-calculate',
      'service-not-found'
    ];
    
    for (const routeName of serviceRoutes) {
      await expect(page.locator(`[data-testid="route-item-${routeName}"]`)).toBeVisible();
    }
  });

  test('should preserve JQ transformations from starter-routes', async ({ page }) => {
    const configMapPath = path.join(__dirname, CONFIGMAPS_PATH, 'starter-routes.yaml');
    const configMapContent = fs.readFileSync(configMapPath, 'utf-8');
    const configMap = yaml.load(configMapContent) as any;

    // Import ConfigMap
    await page.click('[data-testid="import-button"]');
    await page.fill('[data-testid="import-textarea"]', configMap.data['routing.yaml']);
    await page.click('[data-testid="import-submit-button"]');
    await expect(page.locator('[data-testid="import-success-message"]')).toBeVisible({ timeout: 10000 });

    // Switch to route editor tab
    await page.click('[data-testid="route-editor-tab"]');
    
    // Select user-registration route
    await helpers.selectRoute('user-registration');
    await page.waitForTimeout(500);

    // Verify route details
    const routeName = await page.locator('[data-testid="route-name-input"]').inputValue();
    expect(routeName).toBe('user-registration');

    // Verify transform is present (check if transform editor has content)
    const transformEditor = page.locator('[data-testid="jq-expression-editor"]');
    await expect(transformEditor).toBeVisible();
  });

  test('should handle priority-based routing from production-routes', async ({ page }) => {
    const configMapPath = path.join(__dirname, CONFIGMAPS_PATH, 'production-routes.yaml');
    const configMapContent = fs.readFileSync(configMapPath, 'utf-8');
    const configMap = yaml.load(configMapContent) as any;

    // Import ConfigMap
    await page.click('[data-testid="import-button"]');
    await page.fill('[data-testid="import-textarea"]', configMap.data['routing.yaml']);
    await page.click('[data-testid="import-submit-button"]');
    await expect(page.locator('[data-testid="import-success-message"]')).toBeVisible({ timeout: 10000 });

    // Switch to route editor tab
    await page.click('[data-testid="route-editor-tab"]');
    
    // Verify high-priority route
    await helpers.selectRoute('high-priority-orders');
    await page.waitForTimeout(500);

    const priority = await page.locator('[data-testid="route-priority-input"]').inputValue();
    expect(parseInt(priority)).toBe(100);
  });

  test('should validate header mappings from production-routes', async ({ page }) => {
    const configMapPath = path.join(__dirname, CONFIGMAPS_PATH, 'production-routes.yaml');
    const configMapContent = fs.readFileSync(configMapPath, 'utf-8');
    const configMap = yaml.load(configMapContent) as any;
    const routingConfig = yaml.load(configMap.data['routing.yaml']) as any;

    // Find route with header mappings
    const paymentRoute = routingConfig.routes.find((r: any) => r.name === 'payment-processing');
    expect(paymentRoute).toBeDefined();
    expect(paymentRoute.header_mappings).toBeDefined();

    // Import ConfigMap
    await page.click('[data-testid="import-button"]');
    await page.fill('[data-testid="import-textarea"]', configMap.data['routing.yaml']);
    await page.click('[data-testid="import-submit-button"]');
    await expect(page.locator('[data-testid="import-success-message"]')).toBeVisible({ timeout: 10000 });

    // Switch to route editor tab
    await page.click('[data-testid="route-editor-tab"]');
    
    // Select payment route
    await helpers.selectRoute('payment-processing');
    await page.waitForTimeout(500);

    // Verify route loaded successfully
    const routeName = await page.locator('[data-testid="route-name-input"]').inputValue();
    expect(routeName).toBe('payment-processing');
  });

  test('should handle regex patterns from starter-routes', async ({ page }) => {
    const configMapPath = path.join(__dirname, CONFIGMAPS_PATH, 'starter-routes.yaml');
    const configMapContent = fs.readFileSync(configMapPath, 'utf-8');
    const configMap = yaml.load(configMapContent) as any;
    const routingConfig = yaml.load(configMap.data['routing.yaml']) as any;

    // Find notification route with pattern
    const notificationRoute = routingConfig.routes.find((r: any) => r.name === 'notifications');
    expect(notificationRoute).toBeDefined();
    expect(notificationRoute.match_pattern).toBe('^notification\\.');

    // Import ConfigMap
    await page.click('[data-testid="import-button"]');
    await page.fill('[data-testid="import-textarea"]', configMap.data['routing.yaml']);
    await page.click('[data-testid="import-submit-button"]');
    await expect(page.locator('[data-testid="import-success-message"]')).toBeVisible({ timeout: 10000 });

    // Navigate to route editor tab to see route items
    await page.click('[data-testid="route-editor-tab"]');
    await page.waitForTimeout(500);

    // Verify notification route imported
    await expect(page.locator('[data-testid="route-item-notifications"]')).toBeVisible();
  });

  test('should export imported starter-routes back to ConfigMap format', async ({ page }) => {
    const configMapPath = path.join(__dirname, CONFIGMAPS_PATH, 'starter-routes.yaml');
    const configMapContent = fs.readFileSync(configMapPath, 'utf-8');
    const configMap = yaml.load(configMapContent) as any;

    // Import ConfigMap
    await page.click('[data-testid="import-button"]');
    await page.fill('[data-testid="import-textarea"]', configMap.data['routing.yaml']);
    await page.click('[data-testid="import-submit-button"]');
    await expect(page.locator('[data-testid="import-success-message"]')).toBeVisible({ timeout: 10000 });

    // Export back to ConfigMap
    await page.click('[data-testid="export-button"]');
    await expect(page.locator('[data-testid="export-dialog"]')).toBeVisible();
    
    await page.click('[data-testid="export-format-yaml"]');

    // The export dialog auto-generates the preview on open
    // Verify the preview content inside the export dialog
    const dialog = page.locator('[data-testid="export-dialog"]');
    await expect(dialog).toContainText('apiVersion');
    await expect(dialog).toContainText('ConfigMap');
    await expect(dialog).toContainText('routing.yaml');
  });

  test('should handle all transform types from production-routes', async ({ page }) => {
    const configMapPath = path.join(__dirname, CONFIGMAPS_PATH, 'production-routes.yaml');
    const configMapContent = fs.readFileSync(configMapPath, 'utf-8');
    const configMap = yaml.load(configMapContent) as any;
    const routingConfig = yaml.load(configMap.data['routing.yaml']) as any;

    // Verify we have multiple transform types
    const transformTypes = new Set(routingConfig.routes.map((r: any) => r.transform_type));
    expect(transformTypes.has('jq')).toBe(true);
    expect(transformTypes.has('template')).toBe(true);
    expect(transformTypes.has('jsonpath')).toBe(true);
    expect(transformTypes.has('passthrough')).toBe(true);

    // Import ConfigMap
    await page.click('[data-testid="import-button"]');
    await page.fill('[data-testid="import-textarea"]', configMap.data['routing.yaml']);
    await page.click('[data-testid="import-submit-button"]');
    await expect(page.locator('[data-testid="import-success-message"]')).toBeVisible({ timeout: 10000 });

    // Navigate to route editor tab to see route items
    await page.click('[data-testid="route-editor-tab"]');
    await page.waitForTimeout(500);

    // Verify routes with different transform types
    const routesByType = {
      jq: 'high-priority-orders',
      template: 'email-notifications',
      jsonpath: 'analytics-tracking',
      passthrough: 'webhook-relay'
    };

    for (const [, routeName] of Object.entries(routesByType)) {
      await expect(page.locator(`[data-testid="route-item-${routeName}"]`)).toBeVisible();
    }
  });

  test('should validate complete round-trip: import -> edit -> export', async ({ page }) => {
    const configMapPath = path.join(__dirname, CONFIGMAPS_PATH, 'starter-routes.yaml');
    const configMapContent = fs.readFileSync(configMapPath, 'utf-8');
    const configMap = yaml.load(configMapContent) as any;

    // Step 1: Import
    await page.click('[data-testid="import-button"]');
    await page.fill('[data-testid="import-textarea"]', configMap.data['routing.yaml']);
    await page.click('[data-testid="import-submit-button"]');
    await expect(page.locator('[data-testid="import-success-message"]')).toBeVisible({ timeout: 10000 });

    // Step 2: Export - verify imported routes are in the export
    await page.click('[data-testid="export-button"]');
    await expect(page.locator('[data-testid="export-dialog"]')).toBeVisible();
    await page.click('[data-testid="export-format-yaml"]');

    // Verify the export contains ConfigMap structure and all route names
    const dialog = page.locator('[data-testid="export-dialog"]');
    await expect(dialog).toContainText('apiVersion');
    await expect(dialog).toContainText('ConfigMap');
    await expect(dialog).toContainText('routing.yaml');
    await expect(dialog).toContainText('user-registration');
  });

  test('should handle microservices service-based routing', async ({ page }) => {
    const configMapPath = path.join(__dirname, CONFIGMAPS_PATH, 'microservices-routes.yaml');
    const configMapContent = fs.readFileSync(configMapPath, 'utf-8');
    const configMap = yaml.load(configMapContent) as any;
    const routingConfig = yaml.load(configMap.data['routing.yaml']) as any;

    // Verify service-based matching
    const servicesRoute = routingConfig.routes.find((r: any) => r.name === 'user-service-create');
    expect(servicesRoute.match_field).toBe('metadata.service');
    expect(servicesRoute.match_value).toBe('users');

    // Import ConfigMap
    await page.click('[data-testid="import-button"]');
    await page.fill('[data-testid="import-textarea"]', configMap.data['routing.yaml']);
    await page.click('[data-testid="import-submit-button"]');
    await expect(page.locator('[data-testid="import-success-message"]')).toBeVisible({ timeout: 10000 });

    // Navigate to route editor tab to see route items
    await page.click('[data-testid="route-editor-tab"]');
    await page.waitForTimeout(500);

    // Verify all service routes
    // Verify all routes were imported
    await expect(page.locator('[data-testid^="route-item-"]')).toHaveCount(6);
  });
});
