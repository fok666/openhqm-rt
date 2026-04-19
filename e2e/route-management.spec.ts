import { test, expect, RouteManagerHelpers } from './fixtures';

/**
 * E2E tests for Route Management functionality
 * 
 * Tests cover:
 * - Creating new routes
 * - Editing existing routes
 * - Deleting routes
 * - Enabling/disabling routes
 * - Route priority management
 * - Route conditions
 * - Route validation
 */

test.describe('Route Management', () => {
  let helpers: RouteManagerHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new RouteManagerHelpers(page);
    await helpers.goto();
    await helpers.waitForAppReady();
  });

  test('should load the application successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/OpenHQM Router Manager/i);
    await expect(page.locator('[data-testid="app-container"]')).toBeVisible();
  });

  test('should create a new route with basic information', async ({ page }) => {
    // Click new route button
    await page.click('[data-testid="new-route-button"]');
    
    // Wait for route editor
    await page.waitForSelector('[data-testid="route-editor"]');
    
    // Fill in basic information
    await page.fill('[data-testid="route-name-input"]', 'Test Route');
    await page.fill('[data-testid="route-description-input"]', 'Test route description');
    await page.fill('[data-testid="route-priority-input"]', '100');
    
    // Save route
    await page.click('[data-testid="save-route-button"]');
    
    // Verify success message
    await expect(page.locator('[data-testid="save-success-message"]')).toBeVisible();
    
    // Verify route appears in list
    await expect(page.locator('[data-testid="route-item-Test Route"]')).toBeVisible();
  });

  test('should create a route with conditions', async ({ page, helpers }) => {
    await helpers.createRoute('Conditional Route');
    
    // Add first condition
    await page.click('[data-testid="add-condition-button"]');
    await page.fill('[data-testid="condition-field-input"]', 'order.priority');
    await page.selectOption('[data-testid="condition-operator-select"]', 'equals');
    await page.fill('[data-testid="condition-value-input"]', 'high');
    
    // Add second condition
    await page.click('[data-testid="add-condition-button"]');
    const conditionFields = page.locator('[data-testid="condition-field-input"]');
    await conditionFields.nth(1).fill('customer.type');
    const conditionOperators = page.locator('[data-testid="condition-operator-select"]');
    await conditionOperators.nth(1).selectOption('equals');
    const conditionValues = page.locator('[data-testid="condition-value-input"]');
    await conditionValues.nth(1).fill('premium');
    
    // Set condition operator to AND
    await page.selectOption('[data-testid="condition-operator"]', 'AND');
    
    await helpers.saveRoute();
    
    // Verify route with conditions is created
    await expect(page.locator('[data-testid="route-item-Conditional Route"]')).toBeVisible();
  });

  test('should create a route with JQ transformation', async ({ page }) => {
    await helpers.createRoute('Transform Route');
    
    // Enable transformation
    await page.click('[data-testid="enable-transform-toggle"]');
    
    // Add JQ expression using Monaco editor
    const jqExpression = '{ orderId: .order.id, customerId: .customer.id, priority: "HIGH" }';
    await page.fill('[data-testid="jq-expression-editor"] textarea', jqExpression);
    
    // Test transform button
    await page.click('[data-testid="test-transform-button"]');
    
    await helpers.saveRoute();
    
    await expect(page.locator('[data-testid="route-item-Transform Route"]')).toBeVisible();
  });

  test('should edit an existing route', async ({ page }) => {
    // Create a route first
    await helpers.createRoute('Route to Edit');
    await helpers.saveRoute();
    
    // Select the route
    await page.click('[data-testid="route-item-Route to Edit"]');
    
    // Edit the name
    await page.fill('[data-testid="route-name-input"]', 'Edited Route Name');
    
    // Save changes
    await helpers.saveRoute();
    
    // Verify updated name
    await expect(page.locator('[data-testid="route-item-Edited Route Name"]')).toBeVisible();
    await expect(page.locator('[data-testid="route-item-Route to Edit"]')).not.toBeVisible();
  });

  test('should delete a route', async ({ page }) => {
    // Create a route
    await helpers.createRoute('Route to Delete');
    await helpers.saveRoute();
    
    // Verify it exists
    await expect(page.locator('[data-testid="route-item-Route to Delete"]')).toBeVisible();
    
    // Delete the route
    await page.click('[data-testid="route-item-Route to Delete"] [data-testid="delete-button"]');
    
    // Confirm deletion
    await page.click('[data-testid="confirm-delete-button"]');
    
    // Verify route is gone
    await expect(page.locator('[data-testid="route-item-Route to Delete"]')).not.toBeVisible();
  });

  test('should enable and disable routes', async ({ page }) => {
    await helpers.createRoute('Toggle Route');
    await helpers.saveRoute();
    
    const routeItem = page.locator('[data-testid="route-item-Toggle Route"]');
    
    // Verify route is enabled by default
    await expect(routeItem.locator('[data-testid="route-enabled-indicator"]')).toHaveClass(/enabled/);
    
    // Disable route
    await routeItem.locator('[data-testid="toggle-enabled"]').click();
    
    // Verify route is disabled
    await expect(routeItem.locator('[data-testid="route-enabled-indicator"]')).toHaveClass(/disabled/);
    
    // Re-enable route
    await routeItem.locator('[data-testid="toggle-enabled"]').click();
    
    // Verify route is enabled again
    await expect(routeItem.locator('[data-testid="route-enabled-indicator"]')).toHaveClass(/enabled/);
  });

  test('should reorder routes by priority', async ({ page }) => {
    // Create multiple routes with different priorities
    await helpers.createRoute('Low Priority Route');
    await page.fill('[data-testid="route-priority-input"]', '10');
    await helpers.saveRoute();
    
    await helpers.createRoute('High Priority Route');
    await page.fill('[data-testid="route-priority-input"]', '100');
    await helpers.saveRoute();
    
    await helpers.createRoute('Medium Priority Route');
    await page.fill('[data-testid="route-priority-input"]', '50');
    await helpers.saveRoute();
    
    // Verify routes are ordered by priority (high to low)
    const routeItems = page.locator('[data-testid^="route-item-"]');
    const firstRoute = routeItems.nth(0);
    const secondRoute = routeItems.nth(1);
    const thirdRoute = routeItems.nth(2);
    
    await expect(firstRoute).toContainText('High Priority Route');
    await expect(secondRoute).toContainText('Medium Priority Route');
    await expect(thirdRoute).toContainText('Low Priority Route');
  });

  test('should validate route data', async ({ page }) => {
    await page.click('[data-testid="new-route-button"]');
    
    // Try to save without required fields
    await page.click('[data-testid="save-route-button"]');
    
    // Verify validation errors
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="validation-error"]')).toContainText(/name is required/i);
  });

  test('should search and filter routes', async ({ page }) => {
    // Create multiple routes
    await helpers.createRoute('Production Route');
    await helpers.saveRoute();
    
    await helpers.createRoute('Development Route');
    await helpers.saveRoute();
    
    await helpers.createRoute('Testing Route');
    await helpers.saveRoute();
    
    // Search for specific route
    await page.fill('[data-testid="route-search-input"]', 'Production');
    
    // Verify only matching route is visible
    await expect(page.locator('[data-testid="route-item-Production Route"]')).toBeVisible();
    await expect(page.locator('[data-testid="route-item-Development Route"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="route-item-Testing Route"]')).not.toBeVisible();
    
    // Clear search
    await page.fill('[data-testid="route-search-input"]', '');
    
    // Verify all routes are visible again
    await expect(page.locator('[data-testid="route-item-Production Route"]')).toBeVisible();
    await expect(page.locator('[data-testid="route-item-Development Route"]')).toBeVisible();
    await expect(page.locator('[data-testid="route-item-Testing Route"]')).toBeVisible();
  });

  test('should duplicate a route', async ({ page }) => {
    await helpers.createRoute('Original Route');
    await page.fill('[data-testid="route-description-input"]', 'Original description');
    await helpers.saveRoute();
    
    // Duplicate the route
    await page.click('[data-testid="route-item-Original Route"] [data-testid="duplicate-button"]');
    
    // Verify duplicated route exists
    await expect(page.locator('[data-testid="route-item-Original Route (Copy)"]')).toBeVisible();
  });

  test('should show route statistics', async ({ page }) => {
    // Create routes
    await helpers.createRoute('Route 1');
    await helpers.saveRoute();
    
    await helpers.createRoute('Route 2');
    await helpers.saveRoute();
    
    // Check statistics panel
    const statsPanel = page.locator('[data-testid="route-statistics"]');
    await expect(statsPanel).toBeVisible();
    await expect(statsPanel.locator('[data-testid="total-routes"]')).toContainText('2');
  });
});
