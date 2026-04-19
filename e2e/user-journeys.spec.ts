import { test, expect, RouteManagerHelpers } from './fixtures';

/**
 * E2E tests for complete user journeys
 * 
 * Tests real-world scenarios from start to finish:
 * - New user onboarding flow
 * - Creating production-ready routes
 * - Testing and deploying routes
 * - Managing multiple environments
 * - Troubleshooting and debugging
 */

test.describe('User Journeys', () => {
  let helpers: RouteManagerHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new RouteManagerHelpers(page);
    await helpers.goto();
    await helpers.waitForAppReady();
  });

  test('Journey 1: Create, test, and export a simple route', async ({ page }) => {
    // Step 1: User creates a new route
    await page.click('[data-testid="new-route-button"]');
    await page.fill('[data-testid="route-name-input"]', 'High Priority Orders');
    await page.fill('[data-testid="route-description-input"]', 'Route high-priority customer orders to dedicated service');
    await page.fill('[data-testid="route-priority-input"]', '100');
    
    // Step 2: Add condition
    await page.click('[data-testid="add-condition-button"]');
    await page.fill('[data-testid="condition-field-input"]', 'order.priority');
    await page.selectOption('[data-testid="condition-operator-select"]', 'equals');
    await page.fill('[data-testid="condition-value-input"]', 'high');
    
    // Step 3: Configure destination
    await page.fill('[data-testid="destination-endpoint-input"]', 'order-service-high-priority');
    
    // Step 4: Save route
    await helpers.saveRoute();
    await expect(page.locator('[data-testid="route-item-High Priority Orders"]')).toBeVisible();
    
    // Step 5: Test with simulator
    await helpers.openSimulator();
    const testPayload = {
      order: {
        id: 12345,
        priority: 'high',
        customer: { id: 'CUST-001' }
      }
    };
    await helpers.runSimulation(testPayload);
    
    // Verify route matches
    await expect(page.locator('[data-testid="matched-route"]')).toContainText('High Priority Orders');
    await expect(page.locator('[data-testid="destination-display"]')).toContainText('order-service-high-priority');
    
    // Step 6: Export as ConfigMap
    await page.click('[data-testid="route-editor-tab"]');
    await page.click('[data-testid="export-button"]');
    await page.fill('[data-testid="configmap-namespace-input"]', 'production');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-download-button"]');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toBe('openhqm-routes.yaml');
  });

  test('Journey 2: Complex multi-condition route with transformation', async ({ page }) => {
    // Scenario: Premium customers with large orders need special handling
    
    // Step 1: Create route
    await page.click('[data-testid="new-route-button"]');
    await page.fill('[data-testid="route-name-input"]', 'Premium Large Orders');
    await page.fill('[data-testid="route-priority-input"]', '90');
    
    // Step 2: Add multiple conditions with AND
    await page.click('[data-testid="add-condition-button"]');
    await page.fill('[data-testid="condition-field-input"]', 'customer.tier');
    await page.selectOption('[data-testid="condition-operator-select"]', 'equals');
    await page.fill('[data-testid="condition-value-input"]', 'premium');
    
    await page.click('[data-testid="add-condition-button"]');
    await page.locator('[data-testid="condition-field-input"]').nth(1).fill('order.total');
    await page.locator('[data-testid="condition-operator-select"]').nth(1).selectOption('gt');
    await page.locator('[data-testid="condition-value-input"]').nth(1).fill('1000');
    
    await page.selectOption('[data-testid="condition-operator"]', 'AND');
    
    // Step 3: Add JQ transformation to enrich data
    await page.click('[data-testid="enable-transform-toggle"]');
    const jqExpression = `{
  orderId: .order.id,
  customerId: .customer.id,
  customerTier: .customer.tier,
  orderTotal: .order.total,
  priority: "PREMIUM_LARGE",
  sla: 2,
  items: [.order.items[] | { sku: .sku, quantity: .quantity, price: .price }],
  timestamp: now | todate
}`;
    await page.fill('[data-testid="jq-expression-editor"] textarea', jqExpression);
    
    // Step 4: Test transformation in JQ Playground
    await helpers.openJQPlayground();
    const testInput = {
      order: {
        id: 'ORD-12345',
        total: 2500,
        items: [
          { sku: 'ITEM-001', quantity: 2, price: 500 },
          { sku: 'ITEM-002', quantity: 3, price: 500 }
        ]
      },
      customer: {
        id: 'CUST-001',
        tier: 'premium',
        name: 'Premium Customer'
      }
    };
    
    await page.fill('[data-testid="jq-input-editor"] textarea', JSON.stringify(testInput, null, 2));
    await page.fill('[data-testid="jq-expression-editor"] textarea', jqExpression);
    await page.click('[data-testid="run-transform-button"]');
    
    // Verify transformation works
    await page.waitForSelector('[data-testid="jq-output-display"]');
    const output = await page.textContent('[data-testid="jq-output-display"]');
    expect(output).toContain('PREMIUM_LARGE');
    expect(output).toContain('ORD-12345');
    
    // Step 5: Go back to route editor and save
    await page.click('[data-testid="route-editor-tab"]');
    await helpers.saveRoute();
    
    // Step 6: Run full simulation
    await helpers.openSimulator();
    await helpers.runSimulation(testInput);
    
    await expect(page.locator('[data-testid="matched-route"]')).toContainText('Premium Large Orders');
    await expect(page.locator('[data-testid="transformed-payload"]')).toContainText('PREMIUM_LARGE');
    
    // Step 7: Check execution trace
    await page.click('[data-testid="show-trace-button"]');
    await expect(page.locator('[data-testid="trace-step"]')).toHaveCount(4);
    
    // Verify all conditions passed
    const conditionSteps = page.locator('[data-testid="condition-evaluation"]');
    await expect(conditionSteps.nth(0)).toContainText('customer.tier');
    await expect(conditionSteps.nth(1)).toContainText('order.total');
  });

  test('Journey 3: Import existing routes, modify, and re-export', async ({ page }) => {
    // Scenario: DevOps engineer imports prod config to test environment
    
    // Step 1: Import existing ConfigMap
    const existingConfigMap = `apiVersion: v1
kind: ConfigMap
metadata:
  name: openhqm-routes
  namespace: production
  labels:
    environment: production
data:
  routes.yaml: |
    version: "1.0"
    routes:
      - id: prod-route-001
        name: "Production Order Route"
        enabled: true
        priority: 100
        conditions:
          - type: payload
            field: order.status
            operator: equals
            value: "confirmed"
        destination:
          type: endpoint
          endpoint: order-processor-prod
      - id: prod-route-002
        name: "Production Refund Route"
        enabled: true
        priority: 90
        conditions:
          - type: payload
            field: refund.status
            operator: equals
            value: "approved"
        destination:
          type: endpoint
          endpoint: refund-processor-prod`;
    
    await page.click('[data-testid="import-button"]');
    await page.fill('[data-testid="import-textarea"]', existingConfigMap);
    await page.click('[data-testid="import-confirm-button"]');
    
    await expect(page.locator('[data-testid="import-success-message"]')).toBeVisible();
    
    // Step 2: Verify routes imported
    await expect(page.locator('[data-testid="route-item-Production Order Route"]')).toBeVisible();
    await expect(page.locator('[data-testid="route-item-Production Refund Route"]')).toBeVisible();
    
    // Step 3: Modify first route for testing environment
    await page.click('[data-testid="route-item-Production Order Route"]');
    await page.fill('[data-testid="route-name-input"]', 'Testing Order Route');
    await page.fill('[data-testid="destination-endpoint-input"]', 'order-processor-test');
    await helpers.saveRoute();
    
    // Step 4: Add a new test-specific route
    await page.click('[data-testid="new-route-button"]');
    await page.fill('[data-testid="route-name-input"]', 'Testing Debug Route');
    await page.fill('[data-testid="route-priority-input"]', '110');
    
    await page.click('[data-testid="add-condition-button"]');
    await page.selectOption('[data-testid="condition-type-select"]', 'header');
    await page.fill('[data-testid="condition-field-input"]', 'X-Debug-Mode');
    await page.selectOption('[data-testid="condition-operator-select"]', 'equals');
    await page.fill('[data-testid="condition-value-input"]', 'true');
    
    await helpers.saveRoute();
    
    // Step 5: Export as test environment ConfigMap
    await page.click('[data-testid="export-button"]');
    await page.fill('[data-testid="configmap-name-input"]', 'openhqm-routes-test');
    await page.fill('[data-testid="configmap-namespace-input"]', 'testing');
    
    await page.click('[data-testid="add-label-button"]');
    await page.fill('[data-testid="label-key-input"]', 'environment');
    await page.fill('[data-testid="label-value-input"]', 'testing');
    
    // Step 6: Preview and verify changes
    await page.click('[data-testid="preview-configmap-button"]');
    const preview = await page.textContent('[data-testid="configmap-preview"]');
    
    expect(preview).toContain('name: openhqm-routes-test');
    expect(preview).toContain('namespace: testing');
    expect(preview).toContain('Testing Order Route');
    expect(preview).toContain('Testing Debug Route');
    expect(preview).toContain('order-processor-test');
    expect(preview).not.toContain('order-processor-prod');
  });

  test('Journey 4: Troubleshoot failing route with simulator', async ({ page }) => {
    // Scenario: Route not matching as expected, need to debug
    
    // Step 1: Create route that seems correct but has issues
    await helpers.createRoute('Customer Segmentation Route');
    await page.fill('[data-testid="route-priority-input"]', '80');
    
    // Condition with typo in field name
    await page.click('[data-testid="add-condition-button"]');
    await page.fill('[data-testid="condition-field-input"]', 'custommer.type'); // Typo!
    await page.selectOption('[data-testid="condition-operator-select"]', 'equals');
    await page.fill('[data-testid="condition-value-input"]', 'enterprise');
    
    await helpers.saveRoute();
    
    // Step 2: Test with simulator
    await helpers.openSimulator();
    const testPayload = {
      customer: { // Correct spelling
        type: 'enterprise',
        id: 'CUST-001'
      },
      order: {
        id: 'ORD-001'
      }
    };
    
    await helpers.runSimulation(testPayload);
    
    // Step 3: Route doesn't match
    await expect(page.locator('[data-testid="no-route-matched"]')).toBeVisible();
    
    // Step 4: Check execution trace to see what went wrong
    await page.click('[data-testid="show-trace-button"]');
    
    const trace = page.locator('[data-testid="trace-step"]').filter({ hasText: 'condition failed' });
    await expect(trace).toBeVisible();
    await expect(trace).toContainText('custommer.type'); // Shows the typo
    
    // Step 5: Debug with JQ Playground
    await helpers.openJQPlayground();
    await page.fill('[data-testid="jq-input-editor"] textarea', JSON.stringify(testPayload, null, 2));
    
    // Try the wrong path
    await page.fill('[data-testid="jq-expression-editor"] textarea', '.custommer.type');
    await page.click('[data-testid="run-transform-button"]');
    await expect(page.locator('[data-testid="jq-output-display"]')).toContainText('null');
    
    // Try the correct path
    await page.fill('[data-testid="jq-expression-editor"] textarea', '.customer.type');
    await page.click('[data-testid="run-transform-button"]');
    await expect(page.locator('[data-testid="jq-output-display"]')).toContainText('enterprise');
    
    // Step 6: Fix the route
    await page.click('[data-testid="route-editor-tab"]');
    await page.click('[data-testid="route-item-Customer Segmentation Route"]');
    await page.fill('[data-testid="condition-field-input"]', 'customer.type'); // Fixed!
    await helpers.saveRoute();
    
    // Step 7: Test again
    await helpers.openSimulator();
    await helpers.runSimulation(testPayload);
    
    // Now it works!
    await expect(page.locator('[data-testid="matched-route"]')).toContainText('Customer Segmentation Route');
    await expect(page.locator('[data-testid="simulation-status"]')).toContainText('Success');
  });

  test('Journey 5: Setup routing for multi-region deployment', async ({ page }) => {
    // Scenario: Route orders to different regions based on customer location
    
    // Step 1: Create region-specific routes
    const regions = [
      { name: 'US East', priority: 100, region: 'us-east', endpoint: 'order-processor-us-east' },
      { name: 'US West', priority: 99, region: 'us-west', endpoint: 'order-processor-us-west' },
      { name: 'EU', priority: 98, region: 'eu', endpoint: 'order-processor-eu' },
      { name: 'Asia Pacific', priority: 97, region: 'apac', endpoint: 'order-processor-apac' }
    ];
    
    for (const region of regions) {
      await helpers.createRoute(`${region.name} Orders`);
      await page.fill('[data-testid="route-description-input"]', `Route orders to ${region.name} region`);
      await page.fill('[data-testid="route-priority-input"]', region.priority.toString());
      
      await page.click('[data-testid="add-condition-button"]');
      await page.fill('[data-testid="condition-field-input"]', 'customer.region');
      await page.selectOption('[data-testid="condition-operator-select"]', 'equals');
      await page.fill('[data-testid="condition-value-input"]', region.region);
      
      // Add transformation to add region info
      await page.click('[data-testid="enable-transform-toggle"]');
      await page.fill('[data-testid="jq-expression-editor"] textarea', 
        `{ orderId: .order.id, customerId: .customer.id, region: "${region.region}", endpoint: "${region.endpoint}" }`
      );
      
      await page.fill('[data-testid="destination-endpoint-input"]', region.endpoint);
      
      await helpers.saveRoute();
    }
    
    // Step 2: Test each region
    const testCases = [
      { region: 'us-east', expectedRoute: 'US East Orders' },
      { region: 'us-west', expectedRoute: 'US West Orders' },
      { region: 'eu', expectedRoute: 'EU Orders' },
      { region: 'apac', expectedRoute: 'Asia Pacific Orders' }
    ];
    
    for (const testCase of testCases) {
      await helpers.openSimulator();
      
      const payload = {
        customer: {
          id: 'CUST-001',
          region: testCase.region
        },
        order: {
          id: 'ORD-001'
        }
      };
      
      await helpers.runSimulation(payload);
      
      await expect(page.locator('[data-testid="matched-route"]')).toContainText(testCase.expectedRoute);
      await expect(page.locator('[data-testid="transformed-payload"]')).toContainText(testCase.region);
    }
    
    // Step 3: Export with region-specific metadata
    await page.click('[data-testid="route-editor-tab"]');
    await page.click('[data-testid="export-button"]');
    await page.fill('[data-testid="configmap-name-input"]', 'openhqm-routes-multi-region');
    
    await page.click('[data-testid="add-label-button"]');
    await page.fill('[data-testid="label-key-input"]', 'deployment');
    await page.fill('[data-testid="label-value-input"]', 'multi-region');
    
    await page.click('[data-testid="add-annotation-button"]');
    await page.fill('[data-testid="annotation-key-input"]', 'regions');
    await page.fill('[data-testid="annotation-value-input"]', 'us-east,us-west,eu,apac');
    
    await page.click('[data-testid="preview-configmap-button"]');
    const preview = await page.textContent('[data-testid="configmap-preview"]');
    
    // Verify all routes in export
    expect(preview).toContain('US East Orders');
    expect(preview).toContain('US West Orders');
    expect(preview).toContain('EU Orders');
    expect(preview).toContain('Asia Pacific Orders');
    expect(preview).toContain('deployment: multi-region');
  });

  test('Journey 6: Progressive rollout with priority ordering', async ({ page }) => {
    // Scenario: Gradually roll out new processing logic
    
    // Step 1: Create canary route (highest priority)
    await helpers.createRoute('New Logic Canary');
    await page.fill('[data-testid="route-description-input"]', 'Test new logic with 10% of traffic');
    await page.fill('[data-testid="route-priority-input"]', '100');
    
    // Only match when X-Canary-User header is present
    await page.click('[data-testid="add-condition-button"]');
    await page.selectOption('[data-testid="condition-type-select"]', 'header');
    await page.fill('[data-testid="condition-field-input"]', 'X-Canary-User');
    await page.selectOption('[data-testid="condition-operator-select"]', 'exists');
    
    await page.fill('[data-testid="destination-endpoint-input"]', 'order-processor-v2');
    await helpers.saveRoute();
    
    // Step 2: Create fallback route (standard logic)
    await helpers.createRoute('Standard Logic');
    await page.fill('[data-testid="route-description-input"]', 'Standard processing for all orders');
    await page.fill('[data-testid="route-priority-input"]', '10');
    
    // Match all orders
    await page.click('[data-testid="add-condition-button"]');
    await page.fill('[data-testid="condition-field-input"]', 'order.id');
    await page.selectOption('[data-testid="condition-operator-select"]', 'exists');
    
    await page.fill('[data-testid="destination-endpoint-input"]', 'order-processor-v1');
    await helpers.saveRoute();
    
    // Step 3: Test canary user (should go to v2)
    await helpers.openSimulator();
    await page.click('[data-testid="add-header-button"]');
    await page.fill('[data-testid="header-key-input"]', 'X-Canary-User');
    await page.fill('[data-testid="header-value-input"]', 'true');
    
    const orderPayload = { order: { id: 'ORD-001' } };
    await page.fill('[data-testid="simulation-payload-editor"]', JSON.stringify(orderPayload, null, 2));
    await page.click('[data-testid="run-simulation-button"]');
    
    await expect(page.locator('[data-testid="matched-route"]')).toContainText('New Logic Canary');
    await expect(page.locator('[data-testid="destination-display"]')).toContainText('order-processor-v2');
    
    // Step 4: Test normal user (should go to v1)
    await page.click('[data-testid="remove-header-button"]'); // Remove canary header
    await page.click('[data-testid="run-simulation-button"]');
    
    await expect(page.locator('[data-testid="matched-route"]')).toContainText('Standard Logic');
    await expect(page.locator('[data-testid="destination-display"]')).toContainText('order-processor-v1');
    
    // Step 5: Save simulation scenarios for testing
    await page.click('[data-testid="save-scenario-button"]');
    await page.fill('[data-testid="scenario-name-input"]', 'Canary Rollout Test');
    await page.click('[data-testid="confirm-save-scenario"]');
  });

  test('Journey 7: Handle error scenarios and fallback routes', async ({ page }) => {
    // Scenario: Setup error handling routes
    
    // Step 1: Create specific error route
    await helpers.createRoute('Payment Failed Route');
    await page.fill('[data-testid="route-priority-input"]', '100');
    
    await page.click('[data-testid="add-condition-button"]');
    await page.fill('[data-testid="condition-field-input"]', 'payment.status');
    await page.selectOption('[data-testid="condition-operator-select"]', 'equals');
    await page.fill('[data-testid="condition-value-input"]', 'failed');
    
    await page.fill('[data-testid="destination-endpoint-input"]', 'payment-retry-service');
    await helpers.saveRoute();
    
    // Step 2: Create catch-all error route
    await helpers.createRoute('General Error Route');
    await page.fill('[data-testid="route-priority-input"]', '50');
    
    await page.click('[data-testid="add-condition-button"]');
    await page.fill('[data-testid="condition-field-input"]', 'error');
    await page.selectOption('[data-testid="condition-operator-select"]', 'exists');
    
    await page.fill('[data-testid="destination-endpoint-input"]', 'error-handler-service');
    await helpers.saveRoute();
    
    // Step 3: Test payment failure
    await helpers.openSimulator();
    const failedPayment = {
      order: { id: 'ORD-001' },
      payment: { status: 'failed', reason: 'insufficient_funds' }
    };
    await helpers.runSimulation(failedPayment);
    
    await expect(page.locator('[data-testid="matched-route"]')).toContainText('Payment Failed Route');
    
    // Step 4: Test general error
    const generalError = {
      order: { id: 'ORD-002' },
      error: { code: 500, message: 'Internal server error' }
    };
    await helpers.runSimulation(generalError);
    
    await expect(page.locator('[data-testid="matched-route"]')).toContainText('General Error Route');
  });
});
