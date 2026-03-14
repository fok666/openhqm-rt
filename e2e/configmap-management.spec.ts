import { test, expect, RouteManagerHelpers } from './fixtures';

/**
 * E2E tests for ConfigMap Management functionality
 * 
 * Tests cover:
 * - Exporting routes as Kubernetes ConfigMap (YAML/JSON)
 * - Importing ConfigMap YAML
 * - Validating ConfigMap format
 * - Download functionality
 * - Multiple export formats
 * - ConfigMap metadata management
 */

test.describe('ConfigMap Management', () => {
  let helpers: RouteManagerHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new RouteManagerHelpers(page);
    await helpers.goto();
    await helpers.waitForAppReady();
  });

  test('should export routes as YAML ConfigMap', async ({ page }) => {
    // Create a route
    await helpers.createRoute('Export Test Route');
    await page.fill('[data-testid="route-description-input"]', 'Route for export testing');
    await page.fill('[data-testid="route-priority-input"]', '100');
    await helpers.saveRoute();
    
    // Open export dialog
    await page.click('[data-testid="export-button"]');
    await expect(page.locator('[data-testid="export-dialog"]')).toBeVisible();
    
    // Select YAML format
    await page.click('[data-testid="export-format-yaml"]');
    
    // Trigger download
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-download-button"]');
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toBe('openhqm-routes.yaml');
  });

  test('should export routes as JSON ConfigMap', async ({ page }) => {
    // Create a route
    await helpers.createRoute('JSON Export Route');
    await helpers.saveRoute();
    
    // Export as JSON
    await page.click('[data-testid="export-button"]');
    await page.click('[data-testid="export-format-json"]');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-download-button"]');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toBe('openhqm-routes.json');
  });

  test('should preview ConfigMap before export', async ({ page }) => {
    // Create routes
    await helpers.createRoute('Preview Route 1');
    await helpers.saveRoute();
    
    await helpers.createRoute('Preview Route 2');
    await helpers.saveRoute();
    
    // Open export and preview
    await page.click('[data-testid="export-button"]');
    await page.click('[data-testid="preview-configmap-button"]');
    
    // Verify preview shows ConfigMap structure
    const preview = page.locator('[data-testid="configmap-preview"]');
    await expect(preview).toBeVisible();
    
    const previewText = await preview.textContent();
    expect(previewText).toContain('apiVersion: v1');
    expect(previewText).toContain('kind: ConfigMap');
    expect(previewText).toContain('name: openhqm-routes');
    expect(previewText).toContain('Preview Route 1');
    expect(previewText).toContain('Preview Route 2');
  });

  test('should customize ConfigMap metadata', async ({ page }) => {
    await helpers.createRoute('Custom Metadata Route');
    await helpers.saveRoute();
    
    // Open export
    await page.click('[data-testid="export-button"]');
    
    // Customize metadata
    await page.fill('[data-testid="configmap-name-input"]', 'my-custom-routes');
    await page.fill('[data-testid="configmap-namespace-input"]', 'custom-namespace');
    
    // Add custom labels
    await page.click('[data-testid="add-label-button"]');
    await page.fill('[data-testid="label-key-input"]', 'environment');
    await page.fill('[data-testid="label-value-input"]', 'production');
    
    // Preview
    await page.click('[data-testid="preview-configmap-button"]');
    
    const preview = await page.textContent('[data-testid="configmap-preview"]');
    expect(preview).toContain('name: my-custom-routes');
    expect(preview).toContain('namespace: custom-namespace');
    expect(preview).toContain('environment: production');
  });

  test('should import ConfigMap YAML', async ({ page }) => {
    const configMapYAML = `apiVersion: v1
kind: ConfigMap
metadata:
  name: openhqm-routes
  namespace: openhqm
data:
  routes.yaml: |
    version: "1.0"
    routes:
      - id: imported-route-001
        name: "Imported Route"
        enabled: true
        priority: 50
        conditions:
          - type: payload
            field: order.status
            operator: equals
            value: "pending"
        destination:
          type: endpoint
          endpoint: order-processor`;
    
    // Open import dialog
    await page.click('[data-testid="import-button"]');
    await expect(page.locator('[data-testid="import-dialog"]')).toBeVisible();
    
    // Paste YAML
    await page.fill('[data-testid="import-textarea"]', configMapYAML);
    
    // Import
    await page.click('[data-testid="import-confirm-button"]');
    
    // Wait for success message
    await expect(page.locator('[data-testid="import-success-message"]')).toBeVisible();
    
    // Verify imported route appears in list
    await expect(page.locator('[data-testid="route-item-Imported Route"]')).toBeVisible();
  });

  test('should validate ConfigMap format on import', async ({ page }) => {
    const invalidYAML = `invalid: yaml
this is: not
a valid: configmap`;
    
    await page.click('[data-testid="import-button"]');
    await page.fill('[data-testid="import-textarea"]', invalidYAML);
    await page.click('[data-testid="import-confirm-button"]');
    
    // Verify validation error
    await expect(page.locator('[data-testid="import-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="import-error"]')).toContainText('Invalid ConfigMap format');
  });

  test('should handle duplicate route IDs on import', async ({ page }) => {
    // Create existing route
    await helpers.createRoute('Existing Route');
    await helpers.saveRoute();
    
    // Try to import route with same name
    const configMapYAML = `apiVersion: v1
kind: ConfigMap
metadata:
  name: openhqm-routes
data:
  routes.yaml: |
    version: "1.0"
    routes:
      - id: existing-route
        name: "Existing Route"
        enabled: true
        priority: 50
        destination:
          type: endpoint
          endpoint: test-endpoint`;
    
    await page.click('[data-testid="import-button"]');
    await page.fill('[data-testid="import-textarea"]', configMapYAML);
    await page.click('[data-testid="import-confirm-button"]');
    
    // Verify conflict dialog
    await expect(page.locator('[data-testid="import-conflict-dialog"]')).toBeVisible();
    
    // Choose to replace
    await page.click('[data-testid="replace-existing-button"]');
    
    // Verify success
    await expect(page.locator('[data-testid="import-success-message"]')).toBeVisible();
  });

  test('should import file from disk', async ({ page }) => {
    await page.click('[data-testid="import-button"]');
    
    // Create file input handler
    const fileInput = page.locator('[data-testid="import-file-input"]');
    
    // Mock file upload
    const configMapContent = `apiVersion: v1
kind: ConfigMap
metadata:
  name: openhqm-routes
data:
  routes.yaml: |
    version: "1.0"
    routes:
      - id: file-import-route
        name: "File Import Route"
        enabled: true
        priority: 100
        destination:
          type: endpoint
          endpoint: test-service`;
    
    await fileInput.setInputFiles({
      name: 'routes.yaml',
      mimeType: 'text/yaml',
      buffer: Buffer.from(configMapContent)
    });
    
    // Import the file
    await page.click('[data-testid="import-file-button"]');
    
    // Verify import success
    await expect(page.locator('[data-testid="route-item-File Import Route"]')).toBeVisible();
  });

  test('should export with version information', async ({ page }) => {
    await helpers.createRoute('Versioned Route');
    await helpers.saveRoute();
    
    await page.click('[data-testid="export-button"]');
    await page.click('[data-testid="preview-configmap-button"]');
    
    const preview = await page.textContent('[data-testid="configmap-preview"]');
    
    // Check for version annotation
    expect(preview).toContain('version: "1.0"');
    expect(preview).toMatch(/managedBy.*router-manager/);
  });

  test('should export empty configuration', async ({ page }) => {
    // Don't create any routes
    
    await page.click('[data-testid="export-button"]');
    await page.click('[data-testid="preview-configmap-button"]');
    
    // Verify empty routes array
    const preview = await page.textContent('[data-testid="configmap-preview"]');
    expect(preview).toContain('routes: []');
  });

  test('should export with complex route configurations', async ({ page }) => {
    // Create complex route
    await helpers.createRoute('Complex Route');
    
    // Add multiple conditions
    await page.click('[data-testid="add-condition-button"]');
    await page.fill('[data-testid="condition-field-input"]', 'order.priority');
    await page.selectOption('[data-testid="condition-operator-select"]', 'equals');
    await page.fill('[data-testid="condition-value-input"]', 'high');
    
    await page.click('[data-testid="add-condition-button"]');
    await page.selectOption('[data-testid="condition-type-select"]:nth-of-type(2)', 'header');
    await page.fill('[data-testid="condition-field-input"]:nth-of-type(2)', 'X-Customer-Type');
    await page.selectOption('[data-testid="condition-operator-select"]:nth-of-type(2)', 'equals');
    await page.fill('[data-testid="condition-value-input"]:nth-of-type(2)', 'premium');
    
    // Add transformation
    await page.click('[data-testid="enable-transform-toggle"]');
    await page.fill('[data-testid="jq-expression-editor"] textarea', '{ id: .order.id, customer: .order.customer.id }');
    
    // Add actions
    await page.click('[data-testid="add-action-button"]');
    await page.selectOption('[data-testid="action-type-select"]', 'log');
    await page.fill('[data-testid="action-key-input"]', 'level');
    await page.fill('[data-testid="action-value-input"]', 'info');
    
    await helpers.saveRoute();
    
    // Export
    await page.click('[data-testid="export-button"]');
    await page.click('[data-testid="preview-configmap-button"]');
    
    const preview = await page.textContent('[data-testid="configmap-preview"]');
    
    // Verify all components are present
    expect(preview).toContain('conditions:');
    expect(preview).toContain('type: payload');
    expect(preview).toContain('type: header');
    expect(preview).toContain('transform:');
    expect(preview).toContain('jqExpression:');
    expect(preview).toContain('actions:');
    expect(preview).toContain('type: log');
  });

  test('should copy ConfigMap to clipboard', async ({ page }) => {
    await helpers.createRoute('Copy Test Route');
    await helpers.saveRoute();
    
    await page.click('[data-testid="export-button"]');
    await page.click('[data-testid="preview-configmap-button"]');
    
    // Copy to clipboard
    await page.click('[data-testid="copy-configmap-button"]');
    
    // Verify copy success message
    await expect(page.locator('[data-testid="copy-success-message"]')).toBeVisible();
  });

  test('should show import history', async ({ page }) => {
    // Import first ConfigMap
    const configMap1 = `apiVersion: v1
kind: ConfigMap
metadata:
  name: openhqm-routes-v1
data:
  routes.yaml: |
    version: "1.0"
    routes:
      - id: route-v1
        name: "Route V1"
        enabled: true
        priority: 50
        destination:
          type: endpoint
          endpoint: service-v1`;
    
    await page.click('[data-testid="import-button"]');
    await page.fill('[data-testid="import-textarea"]', configMap1);
    await page.click('[data-testid="import-confirm-button"]');
    await page.waitForSelector('[data-testid="import-success-message"]');
    
    // Import second ConfigMap
    const configMap2 = `apiVersion: v1
kind: ConfigMap
metadata:
  name: openhqm-routes-v2
data:
  routes.yaml: |
    version: "1.0"
    routes:
      - id: route-v2
        name: "Route V2"
        enabled: true
        priority: 60
        destination:
          type: endpoint
          endpoint: service-v2`;
    
    await page.click('[data-testid="import-button"]');
    await page.fill('[data-testid="import-textarea"]', configMap2);
    await page.click('[data-testid="import-confirm-button"]');
    await page.waitForSelector('[data-testid="import-success-message"]');
    
    // View import history
    await page.click('[data-testid="import-button"]');
    await page.click('[data-testid="import-history-tab"]');
    
    // Verify history shows both imports
    await expect(page.locator('[data-testid="import-history-item"]')).toHaveCount(2);
  });

  test('should validate route data integrity after export-import cycle', async ({ page }) => {
    // Create route with all features
    await helpers.createRoute('Integrity Test Route');
    await page.fill('[data-testid="route-description-input"]', 'Test description');
    await page.fill('[data-testid="route-priority-input"]', '75');
    
    await page.click('[data-testid="add-condition-button"]');
    await page.fill('[data-testid="condition-field-input"]', 'order.type');
    await page.selectOption('[data-testid="condition-operator-select"]', 'equals');
    await page.fill('[data-testid="condition-value-input"]', 'special');
    
    await page.click('[data-testid="enable-transform-toggle"]');
    await page.fill('[data-testid="jq-expression-editor"] textarea', '{ orderId: .order.id }');
    
    await helpers.saveRoute();
    
    // Export
    await page.click('[data-testid="export-button"]');
    await page.click('[data-testid="preview-configmap-button"]');
    const exportedYAML = await page.textContent('[data-testid="configmap-preview"]');
    
    // Delete the route
    await helpers.deleteRoute('Integrity Test Route');
    
    // Import the exported YAML
    await page.click('[data-testid="import-button"]');
    await page.fill('[data-testid="import-textarea"]', exportedYAML);
    await page.click('[data-testid="import-confirm-button"]');
    
    // Verify route is back with same properties
    await page.click('[data-testid="route-item-Integrity Test Route"]');
    
    await expect(page.locator('[data-testid="route-name-input"]')).toHaveValue('Integrity Test Route');
    await expect(page.locator('[data-testid="route-description-input"]')).toHaveValue('Test description');
    await expect(page.locator('[data-testid="route-priority-input"]')).toHaveValue('75');
    
    const jqExpression = await page.inputValue('[data-testid="jq-expression-editor"] textarea');
    expect(jqExpression).toContain('orderId');
  });

  test('should handle multiple routes with same priority', async ({ page }) => {
    // Create routes with same priority
    await helpers.createRoute('Priority Route 1');
    await page.fill('[data-testid="route-priority-input"]', '100');
    await helpers.saveRoute();
    
    await helpers.createRoute('Priority Route 2');
    await page.fill('[data-testid="route-priority-input"]', '100');
    await helpers.saveRoute();
    
    // Export
    await page.click('[data-testid="export-button"]');
    await page.click('[data-testid="preview-configmap-button"]');
    
    const preview = await page.textContent('[data-testid="configmap-preview"]');
    
    // Verify both routes are present with same priority
    expect(preview).toContain('Priority Route 1');
    expect(preview).toContain('Priority Route 2');
    expect(preview).toMatch(/priority:\s*100/g);
  });
});
