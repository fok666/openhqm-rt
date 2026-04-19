import { test, expect, RouteManagerHelpers } from './fixtures';

/**
 * E2E tests for Simulator functionality
 * 
 * Tests cover:
 * - Route matching simulation
 * - Transformation execution
 * - Execution trace visualization
 * - Performance metrics
 * - Error handling in simulation
 * - Multiple route scenarios
 * - Edge cases
 */

test.describe('Simulator', () => {
  let helpers: RouteManagerHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new RouteManagerHelpers(page);
    await helpers.goto();
    await helpers.waitForAppReady();
  });

  test('should simulate a simple route match', async ({ page, sampleRoute, samplePayload }) => {
    // Create a route first
    await helpers.createRoute(sampleRoute.name);
    await page.fill('[data-testid="route-priority-input"]', sampleRoute.priority.toString());
    
    // Add condition
    await page.click('[data-testid="add-condition-button"]');
    await page.fill('[data-testid="condition-field-input"]', 'order.priority');
    await page.selectOption('[data-testid="condition-operator-select"]', 'equals');
    await page.fill('[data-testid="condition-value-input"]', 'high');
    
    await helpers.saveRoute();
    
    // Open simulator
    await helpers.openSimulator();
    
    // Enter test payload
    await helpers.runSimulation(samplePayload);
    
    // Verify simulation results
    await expect(page.locator('[data-testid="simulation-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="matched-route"]')).toContainText(sampleRoute.name);
    await expect(page.locator('[data-testid="simulation-status"]')).toContainText('Success');
  });

  test('should show execution trace', async ({ page, sampleRoute, samplePayload }) => {
    // Setup route
    await helpers.createRoute(sampleRoute.name);
    await page.click('[data-testid="add-condition-button"]');
    await page.fill('[data-testid="condition-field-input"]', 'order.priority');
    await page.selectOption('[data-testid="condition-operator-select"]', 'equals');
    await page.fill('[data-testid="condition-value-input"]', 'high');
    await helpers.saveRoute();
    
    // Run simulation
    await helpers.openSimulator();
    await helpers.runSimulation(samplePayload);
    
    // Open execution trace
    await page.click('[data-testid="show-trace-button"]');
    
    // Verify trace steps
    await expect(page.locator('[data-testid="trace-step"]')).toHaveCount(3);
    
    const steps = page.locator('[data-testid="trace-step"]');
    await expect(steps.nth(0)).toContainText('Evaluating conditions');
    await expect(steps.nth(1)).toContainText('Route matched');
    await expect(steps.nth(2)).toContainText('Determining destination');
  });

  test('should simulate transformation', async ({ page, samplePayload }) => {
    // Create route with transformation
    await helpers.createRoute('Transform Test Route');
    
    // Add simple condition
    await page.click('[data-testid="add-condition-button"]');
    await page.fill('[data-testid="condition-field-input"]', 'order.id');
    await page.selectOption('[data-testid="condition-operator-select"]', 'exists');
    
    // Add transformation
    await page.click('[data-testid="enable-transform-toggle"]');
    const jqExpression = '{ orderId: .order.id, customerId: .order.customer.id, itemCount: (.order.items | length) }';
    await page.fill('[data-testid="jq-expression-editor"] textarea', jqExpression);
    
    await helpers.saveRoute();
    
    // Run simulation
    await helpers.openSimulator();
    await helpers.runSimulation(samplePayload);
    
    // Verify transformed payload
    await expect(page.locator('[data-testid="transformed-payload"]')).toBeVisible();
    
    const transformedOutput = await page.textContent('[data-testid="transformed-payload"]');
    expect(transformedOutput).toContain('orderId');
    expect(transformedOutput).toContain('12345');
    expect(transformedOutput).toContain('itemCount');
    expect(transformedOutput).toContain('2');
  });

  test('should handle no route match', async ({ page }) => {
    // Create route with specific condition that won't match
    await helpers.createRoute('Specific Route');
    await page.click('[data-testid="add-condition-button"]');
    await page.fill('[data-testid="condition-field-input"]', 'order.type');
    await page.selectOption('[data-testid="condition-operator-select"]', 'equals');
    await page.fill('[data-testid="condition-value-input"]', 'special');
    await helpers.saveRoute();
    
    // Run simulation with non-matching payload
    await helpers.openSimulator();
    const payload = { order: { id: 123, type: 'normal' } };
    await helpers.runSimulation(payload);
    
    // Verify no match result
    await expect(page.locator('[data-testid="no-route-matched"]')).toBeVisible();
    await expect(page.locator('[data-testid="simulation-status"]')).toContainText('No matching route');
  });

  test('should simulate multiple routes and select highest priority', async ({ page, samplePayload }) => {
    // Create multiple routes
    await helpers.createRoute('Low Priority Route');
    await page.fill('[data-testid="route-priority-input"]', '10');
    await page.click('[data-testid="add-condition-button"]');
    await page.fill('[data-testid="condition-field-input"]', 'order.id');
    await page.selectOption('[data-testid="condition-operator-select"]', 'exists');
    await helpers.saveRoute();
    
    await helpers.createRoute('High Priority Route');
    await page.fill('[data-testid="route-priority-input"]', '100');
    await page.click('[data-testid="add-condition-button"]');
    await page.fill('[data-testid="condition-field-input"]', 'order.priority');
    await page.selectOption('[data-testid="condition-operator-select"]', 'equals');
    await page.fill('[data-testid="condition-value-input"]', 'high');
    await helpers.saveRoute();
    
    // Run simulation
    await helpers.openSimulator();
    await helpers.runSimulation(samplePayload);
    
    // Verify high priority route is selected
    await expect(page.locator('[data-testid="matched-route"]')).toContainText('High Priority Route');
    
    // Check that multiple routes were evaluated
    await page.click('[data-testid="show-trace-button"]');
    await expect(page.locator('[data-testid="routes-evaluated"]')).toContainText('2 routes evaluated');
  });

  test('should display performance metrics', async ({ page, sampleRoute, samplePayload }) => {
    // Setup route
    await helpers.createRoute(sampleRoute.name);
    await page.click('[data-testid="add-condition-button"]');
    await page.fill('[data-testid="condition-field-input"]', 'order.priority');
    await page.selectOption('[data-testid="condition-operator-select"]', 'equals');
    await page.fill('[data-testid="condition-value-input"]', 'high');
    await helpers.saveRoute();
    
    // Run simulation
    await helpers.openSimulator();
    await helpers.runSimulation(samplePayload);
    
    // Check performance metrics
    const metricsPanel = page.locator('[data-testid="performance-metrics"]');
    await expect(metricsPanel).toBeVisible();
    
    await expect(metricsPanel.locator('[data-testid="total-duration"]')).toBeVisible();
    await expect(metricsPanel.locator('[data-testid="matching-duration"]')).toBeVisible();
    await expect(metricsPanel.locator('[data-testid="transform-duration"]')).toBeVisible();
  });

  test('should handle transformation errors in simulation', async ({ page }) => {
    // Create route with invalid transformation
    await helpers.createRoute('Error Route');
    await page.click('[data-testid="add-condition-button"]');
    await page.fill('[data-testid="condition-field-input"]', 'order.id');
    await page.selectOption('[data-testid="condition-operator-select"]', 'exists');
    
    // Add invalid JQ transformation
    await page.click('[data-testid="enable-transform-toggle"]');
    await page.fill('[data-testid="jq-expression-editor"] textarea', '{ invalid syntax }');
    
    await helpers.saveRoute();
    
    // Run simulation
    await helpers.openSimulator();
    const payload = { order: { id: 123 } };
    await helpers.runSimulation(payload);
    
    // Verify error is displayed
    await expect(page.locator('[data-testid="simulation-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="simulation-error"]')).toContainText('Transform error');
  });

  test('should allow custom headers in simulation', async ({ page, samplePayload }) => {
    // Setup route
    await helpers.createRoute('Header Test Route');
    await page.click('[data-testid="add-condition-button"]');
    await page.selectOption('[data-testid="condition-type-select"]', 'header');
    await page.fill('[data-testid="condition-field-input"]', 'X-Customer-Type');
    await page.selectOption('[data-testid="condition-operator-select"]', 'equals');
    await page.fill('[data-testid="condition-value-input"]', 'premium');
    await helpers.saveRoute();
    
    // Open simulator
    await helpers.openSimulator();
    
    // Add custom headers
    await page.click('[data-testid="add-header-button"]');
    await page.fill('[data-testid="header-key-input"]', 'X-Customer-Type');
    await page.fill('[data-testid="header-value-input"]', 'premium');
    
    // Run simulation
    await page.fill('[data-testid="simulation-payload-editor"]', JSON.stringify(samplePayload, null, 2));
    await page.click('[data-testid="run-simulation-button"]');
    
    // Verify route matched
    await expect(page.locator('[data-testid="matched-route"]')).toContainText('Header Test Route');
  });

  test('should allow metadata in simulation', async ({ page, samplePayload }) => {
    // Setup route with metadata condition
    await helpers.createRoute('Metadata Route');
    await page.click('[data-testid="add-condition-button"]');
    await page.selectOption('[data-testid="condition-type-select"]', 'metadata');
    await page.fill('[data-testid="condition-field-input"]', 'source');
    await page.selectOption('[data-testid="condition-operator-select"]', 'equals');
    await page.fill('[data-testid="condition-value-input"]', 'web');
    await helpers.saveRoute();
    
    // Open simulator
    await helpers.openSimulator();
    
    // Add metadata
    await page.click('[data-testid="add-metadata-button"]');
    await page.fill('[data-testid="metadata-key-input"]', 'source');
    await page.fill('[data-testid="metadata-value-input"]', 'web');
    
    // Run simulation
    await page.fill('[data-testid="simulation-payload-editor"]', JSON.stringify(samplePayload, null, 2));
    await page.click('[data-testid="run-simulation-button"]');
    
    // Verify route matched
    await expect(page.locator('[data-testid="matched-route"]')).toContainText('Metadata Route');
  });

  test('should save and load simulation scenarios', async ({ page, samplePayload }) => {
    await helpers.openSimulator();
    
    // Create simulation scenario
    await page.fill('[data-testid="simulation-payload-editor"]', JSON.stringify(samplePayload, null, 2));
    await page.click('[data-testid="add-header-button"]');
    await page.fill('[data-testid="header-key-input"]', 'X-Test-Header');
    await page.fill('[data-testid="header-value-input"]', 'test-value');
    
    // Save scenario
    await page.click('[data-testid="save-scenario-button"]');
    await page.fill('[data-testid="scenario-name-input"]', 'Test Scenario 1');
    await page.click('[data-testid="confirm-save-scenario"]');
    
    // Clear inputs
    await page.fill('[data-testid="simulation-payload-editor"]', '{}');
    
    // Load scenario
    await page.click('[data-testid="load-scenario-button"]');
    await page.click('[data-testid="scenario-Test Scenario 1"]');
    
    // Verify scenario is loaded
    const payloadValue = await page.inputValue('[data-testid="simulation-payload-editor"]');
    expect(payloadValue).toContain('order');
    
    const headerValue = await page.inputValue('[data-testid="header-value-input"]');
    expect(headerValue).toBe('test-value');
  });

  test('should simulate AND condition operator', async ({ page, samplePayload }) => {
    // Create route with multiple conditions using AND
    await helpers.createRoute('AND Conditions Route');
    
    // First condition
    await page.click('[data-testid="add-condition-button"]');
    await page.fill('[data-testid="condition-field-input"]', 'order.priority');
    await page.selectOption('[data-testid="condition-operator-select"]', 'equals');
    await page.fill('[data-testid="condition-value-input"]', 'high');
    
    // Second condition
    await page.click('[data-testid="add-condition-button"]');
    await page.locator('[data-testid="condition-field-input"]').nth(1).fill('order.customer.id');
    await page.locator('[data-testid="condition-operator-select"]').nth(1).selectOption('exists');
    
    // Set to AND
    await page.selectOption('[data-testid="condition-operator"]', 'AND');
    
    await helpers.saveRoute();
    
    // Run simulation
    await helpers.openSimulator();
    await helpers.runSimulation(samplePayload);
    
    // Verify route matched (both conditions satisfied)
    await expect(page.locator('[data-testid="matched-route"]')).toContainText('AND Conditions Route');
    
    // Check trace shows both conditions evaluated
    await page.click('[data-testid="show-trace-button"]');
    await expect(page.locator('[data-testid="condition-evaluation"]')).toHaveCount(2);
  });

  test('should simulate OR condition operator', async ({ page }) => {
    // Create route with multiple conditions using OR
    await helpers.createRoute('OR Conditions Route');
    
    // First condition (will match)
    await page.click('[data-testid="add-condition-button"]');
    await page.fill('[data-testid="condition-field-input"]', 'order.priority');
    await page.selectOption('[data-testid="condition-operator-select"]', 'equals');
    await page.fill('[data-testid="condition-value-input"]', 'high');
    
    // Second condition (won't match)
    await page.click('[data-testid="add-condition-button"]');
    await page.locator('[data-testid="condition-field-input"]').nth(1).fill('order.type');
    await page.locator('[data-testid="condition-operator-select"]').nth(1).selectOption('equals');
    await page.locator('[data-testid="condition-value-input"]').nth(1).fill('special');
    
    // Set to OR
    await page.selectOption('[data-testid="condition-operator"]', 'OR');
    
    await helpers.saveRoute();
    
    // Run simulation with payload that matches first condition only
    await helpers.openSimulator();
    const payload = { order: { id: 123, priority: 'high', type: 'normal' } };
    await helpers.runSimulation(payload);
    
    // Verify route matched (one condition satisfied)
    await expect(page.locator('[data-testid="matched-route"]')).toContainText('OR Conditions Route');
  });

  test('should export simulation results', async ({ page, samplePayload }) => {
    // Setup and run simulation
    await helpers.createRoute('Export Test Route');
    await page.click('[data-testid="add-condition-button"]');
    await page.fill('[data-testid="condition-field-input"]', 'order.id');
    await page.selectOption('[data-testid="condition-operator-select"]', 'exists');
    await helpers.saveRoute();
    
    await helpers.openSimulator();
    await helpers.runSimulation(samplePayload);
    
    // Export results
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-simulation-results"]');
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toMatch(/simulation-results.*\.json/);
  });

  test('should compare multiple simulations', async ({ page, samplePayload }) => {
    // Setup route
    await helpers.createRoute('Compare Route');
    await page.click('[data-testid="add-condition-button"]');
    await page.fill('[data-testid="condition-field-input"]', 'order.priority');
    await page.selectOption('[data-testid="condition-operator-select"]', 'equals');
    await page.fill('[data-testid="condition-value-input"]', 'high');
    await helpers.saveRoute();
    
    await helpers.openSimulator();
    
    // Run first simulation
    await helpers.runSimulation(samplePayload);
    await page.click('[data-testid="save-simulation-result"]');
    
    // Run second simulation with different payload
    const payload2 = { ...samplePayload, order: { ...samplePayload.order, priority: 'low' } };
    await helpers.runSimulation(payload2);
    await page.click('[data-testid="save-simulation-result"]');
    
    // Compare simulations
    await page.click('[data-testid="compare-simulations-button"]');
    
    // Verify comparison view
    await expect(page.locator('[data-testid="simulation-comparison"]')).toBeVisible();
    await expect(page.locator('[data-testid="simulation-result"]')).toHaveCount(2);
  });
});
