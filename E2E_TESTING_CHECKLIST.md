# E2E Testing - Next Steps & Validation Checklist

## 🔧 Setup Steps

### 1. Install Playwright Browsers
```bash
cd openhqm-rt
npm run playwright:install
```

This will download Chromium, Firefox, and WebKit browsers (~500MB total).

### 2. Verify Installation
```bash
# Check Playwright version
npx playwright --version

# List installed browsers
npx playwright list-files
```

## ✅ Validation Checklist

Before running the full test suite, complete these validation steps:

### Phase 1: Component Preparation

The tests use `data-testid` attributes for reliable element selection. You'll need to add these to your React components:

#### App Container
```tsx
// src/App.tsx or main component
<div data-testid="app-container">
  {/* Your app content */}
</div>
```

#### Route Management
```tsx
// Components that need data-testid:
<button data-testid="new-route-button">New Route</button>
<button data-testid="import-button">Import</button>
<button data-testid="export-button">Export</button>
<div data-testid="route-editor">{/* Route editor form */}</div>
<input data-testid="route-name-input" />
<input data-testid="route-description-input" />
<input data-testid="route-priority-input" type="number" />
<button data-testid="save-route-button">Save</button>
<div data-testid="save-success-message">Route saved!</div>
<div data-testid="route-item-{routeName}">{/* Route list item */}</div>
```

#### Conditions
```tsx
<button data-testid="add-condition-button">Add Condition</button>
<select data-testid="condition-type-select">{/* payload, header, etc */}</select>
<input data-testid="condition-field-input" />
<select data-testid="condition-operator-select">{/* equals, contains, etc */}</select>
<input data-testid="condition-value-input" />
<select data-testid="condition-operator">{/* AND, OR */}</select>
```

#### Transform
```tsx
<button data-testid="enable-transform-toggle">Enable Transform</button>
<div data-testid="jq-expression-editor">{/* Monaco editor wrapper */}</div>
<button data-testid="test-transform-button">Test Transform</button>
```

#### Destination
```tsx
<input data-testid="destination-endpoint-input" />
```

#### JQ Playground
```tsx
<button data-testid="jq-playground-tab">JQ Playground</button>
<div data-testid="jq-playground">{/* Playground container */}</div>
<div data-testid="jq-input-editor">{/* Input Monaco editor */}</div>
<div data-testid="jq-expression-editor">{/* Expression Monaco editor */}</div>
<button data-testid="run-transform-button">Run</button>
<div data-testid="jq-output-display">{/* Output display */}</div>
<div data-testid="jq-error-display">{/* Error display */}</div>
<div data-testid="jq-error-suggestions">{/* Error suggestions */}</div>
```

#### Simulator
```tsx
<button data-testid="simulator-tab">Simulator</button>
<div data-testid="simulator">{/* Simulator container */}</div>
<div data-testid="simulation-payload-editor">{/* Monaco editor for payload */}</div>
<button data-testid="add-header-button">Add Header</button>
<input data-testid="header-key-input" />
<input data-testid="header-value-input" />
<button data-testid="run-simulation-button">Run Simulation</button>
<div data-testid="simulation-results">{/* Results container */}</div>
<div data-testid="matched-route">{/* Matched route name */}</div>
<div data-testid="simulation-status">Success</div>
<div data-testid="transformed-payload">{/* Transformed output */}</div>
<button data-testid="show-trace-button">Show Trace</button>
<div data-testid="trace-step">{/* Individual trace step */}</div>
<div data-testid="performance-metrics">{/* Performance panel */}</div>
```

#### Export/Import
```tsx
<div data-testid="export-dialog">{/* Export dialog */}</div>
<button data-testid="export-format-yaml">YAML</button>
<button data-testid="export-format-json">JSON</button>
<button data-testid="preview-configmap-button">Preview</button>
<div data-testid="configmap-preview">{/* Preview display */}</div>
<button data-testid="export-download-button">Download</button>
<input data-testid="configmap-name-input" />
<input data-testid="configmap-namespace-input" />

<div data-testid="import-dialog">{/* Import dialog */}</div>
<textarea data-testid="import-textarea" />
<button data-testid="import-confirm-button">Import</button>
<div data-testid="import-success-message">Import successful!</div>
<div data-testid="import-error">Import failed</div>
```

### Phase 2: Run Smoke Tests

Once components have `data-testid` attributes:

```bash
# Run a single test file to verify setup
npx playwright test route-management --headed

# If that works, run all tests in one browser
npx playwright test --project=chromium

# Then run full suite
npm run test:e2e
```

### Phase 3: Review Results

```bash
# View test report
npm run test:e2e:report

# Check for failures in test-results/ directory
ls -la test-results/
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Element Not Found
```
Error: locator.click: Timeout 30000ms exceeded
```

**Solution**: Add missing `data-testid` attribute to component

#### 2. Test Timeout
```
Test timeout of 30000ms exceeded
```

**Solution**: 
- Check if dev server is running (`npm run dev`)
- Increase timeout in `playwright.config.ts` if needed

#### 3. Monaco Editor Issues
```
Cannot fill Monaco editor
```

**Solution**: Monaco editors need special handling:
```typescript
// For Monaco editor
await page.fill('[data-testid="jq-expression-editor"] textarea', expression);
```

#### 4. Download Tests Fail
```
Download not triggered
```

**Solution**: Ensure download handler is set up before clicking:
```typescript
const downloadPromise = page.waitForEvent('download');
await page.click('[data-testid="export-button"]');
const download = await downloadPromise;
```

## 🎯 Gradual Implementation Approach

If you want to implement tests incrementally:

### Step 1: Start with Route Management
1. Add `data-testid` attributes to route components
2. Run: `npx playwright test route-management --headed`
3. Fix any issues

### Step 2: Add JQ Playground
1. Add `data-testid` attributes to JQ components
2. Run: `npx playwright test jq-playground --headed`
3. Fix any issues

### Step 3: Continue with Other Suites
- Simulator tests
- ConfigMap tests
- User journeys
- Accessibility

## 📊 Test Execution Order

For first-time validation, run tests in this order:

1. **Route Management** - Core functionality
2. **JQ Playground** - Transformation testing
3. **Simulator** - Integration testing
4. **ConfigMap Management** - Import/export
5. **User Journeys** - End-to-end flows
6. **Accessibility** - Compliance checks

## 🔍 Debug Mode

If tests fail, run in debug mode:

```bash
# Debug specific test
npx playwright test route-management --debug

# This will:
# - Open browser with Playwright Inspector
# - Let you step through each action
# - See selectors and page state
```

## 📝 Component Checklist

Use this checklist to track which components have been instrumented:

- [ ] App container
- [ ] Route list
- [ ] Route editor form
- [ ] Conditions editor
- [ ] Transform editor
- [ ] Destination editor
- [ ] JQ Playground
- [ ] Simulator
- [ ] Export dialog
- [ ] Import dialog
- [ ] Success/error messages
- [ ] Loading indicators

## 🚀 CI/CD Validation

Once local tests pass:

1. **Commit changes**:
   ```bash
   git add .
   git commit -m "Add E2E testing with Playwright"
   ```

2. **Push to branch**:
   ```bash
   git push origin feature/e2e-tests
   ```

3. **Create Pull Request**

4. **Monitor GitHub Actions**:
   - Go to Actions tab in GitHub
   - Watch E2E Tests workflow
   - Check test results and artifacts

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Test Selectors Guide](https://playwright.dev/docs/selectors)
- [Debugging Tests](https://playwright.dev/docs/debug)
- [Best Practices](https://playwright.dev/docs/best-practices)

## 🎉 Success Criteria

You'll know the testing setup is complete when:

✅ All 82 tests pass locally
✅ Tests pass in CI on all browsers
✅ Test reports are generated successfully
✅ No flaky tests (consistent results)
✅ Screenshots captured on failures
✅ Trace files available for debugging

## 🆘 Getting Help

If you encounter issues:

1. Check the `e2e/README.md` for detailed documentation
2. Review test output and error messages
3. Use debug mode to step through failing tests
4. Check Playwright logs: `DEBUG=pw:api npx playwright test`

---

**Note**: The test suite is comprehensive but depends on components having the appropriate `data-testid` attributes. Plan to allocate 2-4 hours for adding these attributes to your React components.
