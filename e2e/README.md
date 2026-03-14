# End-to-End Testing for OpenHQM Router Manager

This directory contains comprehensive E2E tests for the OpenHQM Router Manager web application using [Playwright](https://playwright.dev/).

## 📋 Test Coverage

### Test Suites

1. **Route Management** (`route-management.spec.ts`)
   - Creating, editing, and deleting routes
   - Route validation and prioritization
   - Search and filtering
   - Route duplication
   - Enable/disable functionality

2. **JQ Playground** (`jq-playground.spec.ts`)
   - JQ expression execution
   - Syntax validation and error handling
   - Complex transformations
   - Example templates
   - Expression history management

3. **Simulator** (`simulator.spec.ts`)
   - Route matching simulation
   - Transformation execution
   - Execution trace visualization
   - Performance metrics
   - Multi-route scenarios

4. **ConfigMap Management** (`configmap-management.spec.ts`)
   - Export routes as Kubernetes ConfigMaps (YAML/JSON)
   - Import existing ConfigMaps
   - Format validation
   - Metadata customization
   - Import/export integrity

5. **User Journeys** (`user-journeys.spec.ts`)
   - Complete end-to-end workflows
   - Real-world scenarios
   - Multi-step processes
   - Troubleshooting flows
   - Production-ready configurations

6. **OpenHQM Examples** (`openhqm-examples.spec.ts`) ⭐️
   - Validates all OpenHQM example configurations
   - Tests import/export compatibility
   - Verifies JQ transformations from examples
   - Ensures Router Manager handles real-world configs
   - Maintains contract between openhqm and openhqm-rm

## 🚀 Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers
npm run playwright:install
```

### Run All Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in debug mode
npm run test:e2e:debug
```

### Run Specific Tests

```bash
# Run specific test file
npx playwright test route-management

# Run specific test by name
npx playwright test -g "should create a new route"

# Run tests for specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Run OpenHQM Example Validation

Test compatibility with OpenHQM examples:

```bash
# Run OpenHQM examples validation
npx playwright test openhqm-examples

# This validates:
# - Import of all OpenHQM example configurations
# - JQ transformations from routing-config.yaml
# - ConfigMap format compatibility
# - Route matching patterns
# - Complete end-to-end workflows

# These tests ensure Router Manager can handle real OpenHQM configs
```

### Run Mobile Tests

```bash
# Run mobile emulation tests
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"
```

## 📊 Test Reports

### View Test Results

```bash
# Show HTML report
npm run test:e2e:report

# The report will open in your browser
```

### Test Artifacts

After running tests, the following artifacts are generated:

- `playwright-report/` - HTML test report
- `playwright-results.json` - Test results in JSON format
- `playwright-results.xml` - Test results in JUnit XML format
- `test-results/` - Screenshots and videos of failed tests

## 🔧 Configuration

Test configuration is in [`playwright.config.ts`](../playwright.config.ts) at the root level.

### Key Configuration Options

```typescript
{
  testDir: './e2e',
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  }
}
```

## 🏗️ Test Structure

### Test Fixtures

Custom fixtures are defined in `fixtures.ts` and provide:

- Automatic localStorage cleanup
- Sample route configurations
- Sample payloads for testing
- Helper methods for common actions

### Helper Class

The `RouteManagerHelpers` class provides reusable methods:

```typescript
const helpers = new RouteManagerHelpers(page);

// Navigate to app
await helpers.goto();

// Create a route
await helpers.createRoute('My Route');

// Add conditions
await helpers.addCondition('order.priority', 'equals', 'high');

// Save route
await helpers.saveRoute();

// Run simulation
await helpers.runSimulation(payload);
```

## 📝 Writing New Tests

### Basic Test Structure

```typescript
import { test, expect, RouteManagerHelpers } from './fixtures';

test.describe('Feature Name', () => {
  let helpers: RouteManagerHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new RouteManagerHelpers(page);
    await helpers.goto();
    await helpers.waitForAppReady();
  });

  test('should do something', async ({ page }) => {
    // Arrange
    await helpers.createRoute('Test Route');
    
    // Act
    await page.click('[data-testid="some-button"]');
    
    // Assert
    await expect(page.locator('[data-testid="result"]')).toBeVisible();
  });
});
```

### Best Practices

1. **Use data-testid attributes** for reliable selectors
   ```typescript
   await page.click('[data-testid="save-button"]');
   ```

2. **Wait for elements** before interacting
   ```typescript
   await page.waitForSelector('[data-testid="route-editor"]');
   ```

3. **Use meaningful test names** that describe behavior
   ```typescript
   test('should display error when route name is empty', ...)
   ```

4. **Clean up after tests** (fixtures handle localStorage cleanup)

5. **Use fixtures** for common setup and test data

6. **Group related tests** with `test.describe()`

## 🎯 Test Selectors

Always use `data-testid` attributes for selectors:

```html
<!-- Good -->
<button data-testid="save-route-button">Save</button>

<!-- Avoid (brittle) -->
<button class="btn-primary">Save</button>
```

## 🐛 Debugging Tests

### Interactive Debugging

```bash
# Open Playwright Inspector
npm run test:e2e:debug

# Debug specific test
npx playwright test --debug route-management
```

### Generate Tests

```bash
# Record interactions to generate tests
npm run test:e2e:codegen
```

### Screenshots and Videos

Failed tests automatically capture:
- Screenshots (`.png`)
- Videos (`.webm`)
- Trace files (`.zip`)

Access these in the `test-results/` directory.

## 🔄 CI/CD Integration

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests
- Manual workflow dispatch

### GitHub Actions

E2E tests run in parallel across:
- **Operating Systems**: Ubuntu, macOS, Windows
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile Devices**: Mobile Chrome, Mobile Safari

See [`.github/workflows/e2e-tests.yml`](../.github/workflows/e2e-tests.yml) for details.

### Test Matrix

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, macos-latest, windows-latest]
    browser: [chromium, firefox, webkit]
```

## 📈 Performance Testing

Performance metrics are captured during simulation tests:

```typescript
const metricsPanel = page.locator('[data-testid="performance-metrics"]');
await expect(metricsPanel.locator('[data-testid="total-duration"]')).toBeVisible();
```

## 🔐 Security Testing

Tests verify:
- Input validation
- XSS prevention (Monaco editor handles safely)
- Data privacy (localStorage only)
- No external data leakage

## ♿ Accessibility Testing

Run accessibility-focused tests:

```bash
npx playwright test --grep "@accessibility"
```

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Test Selectors](https://playwright.dev/docs/selectors)
- [Visual Comparisons](https://playwright.dev/docs/test-snapshots)

## 🤝 Contributing

When adding new features:

1. Add corresponding E2E tests
2. Use data-testid attributes for new elements
3. Update this README if adding new test suites
4. Run tests locally before pushing: `npm run test:e2e`

## 📞 Support

For questions or issues:
- Check Playwright logs: `DEBUG=pw:api npx playwright test`
- View test report: `npm run test:e2e:report`
- Open an issue in the repository

---

**Happy Testing! 🎭**
