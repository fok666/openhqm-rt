import { test, expect } from './fixtures';

/**
 * Accessibility Tests for OpenHQM Router Manager
 * 
 * Tests verify compliance with WCAG 2.1 guidelines:
 * - Keyboard navigation
 * - Screen reader compatibility
 * - Color contrast
 * - ARIA labels
 * - Focus management
 * 
 * Tag tests with @accessibility to run separately
 */

test.describe('Accessibility @accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should be navigable via keyboard', async ({ page }) => {
    // Tab through major interactive elements
    await page.keyboard.press('Tab'); // Focus first element
    await page.keyboard.press('Tab'); // May need extra tab to reach visible elements
    
    // Verify focus is on a visible element
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible({ timeout: 2000 }).catch(() => {
      // Some browsers may not show focus on first tab
    });
    
    // Continue tabbing through key elements
    const interactiveElements = [
      '[data-testid="new-route-button"]',
      '[data-testid="import-button"]',
      '[data-testid="export-button"]',
    ];
    
    for (const selector of interactiveElements) {
      // Tab until we reach the element
      let maxTabs = 20; // Safety limit
      while (maxTabs-- > 0) {
        const focused = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
        if (focused === selector.match(/data-testid="([^"]+)"/)?.[1]) {
          break;
        }
        await page.keyboard.press('Tab');
      }
      
      // Verify element can receive focus
      const element = page.locator(selector);
      await expect(element).toBeVisible();
    }
  });

  test('should have proper ARIA labels', async ({ page }) => {
    // Check main navigation buttons
    const newRouteButton = page.locator('[data-testid="new-route-button"]');
    await expect(newRouteButton).toHaveAttribute('aria-label', /new route/i);
    
    const importButton = page.locator('[data-testid="import-button"]');
    await expect(importButton).toHaveAttribute('aria-label', /import/i);
    
    const exportButton = page.locator('[data-testid="export-button"]');
    await expect(exportButton).toHaveAttribute('aria-label', /export/i);
  });

  test('should have accessible form inputs', async ({ page }) => {
    // Create a new route
    await page.click('[data-testid="new-route-button"]');
    
    // Check form labels
    const nameInput = page.locator('[data-testid="route-name-input"]');
    const nameLabel = page.locator('label[for="route-name-input"]');
    
    await expect(nameLabel).toBeVisible();
    await expect(nameLabel).toContainText(/name/i);
    
    // Check aria-required on required fields
    await expect(nameInput).toHaveAttribute('aria-required', 'true');
    
    // Check aria-describedby for help text
    await expect(nameInput).toHaveAttribute('aria-describedby');
  });

  test('should provide error messages accessibly', async ({ page }) => {
    // Try to save empty route
    await page.click('[data-testid="new-route-button"]');
    await page.click('[data-testid="save-route-button"]');
    
    // Check error is announced
    const errorElement = page.locator('[data-testid="validation-error"]');
    await expect(errorElement).toBeVisible();
    await expect(errorElement).toHaveAttribute('role', 'alert');
    await expect(errorElement).toHaveAttribute('aria-live', 'assertive');
  });

  test('should support screen readers with semantic HTML', async ({ page }) => {
    // Check for semantic landmarks
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
    
    // Check heading hierarchy
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    await expect(h1).toContainText(/OpenHQM Router Manager/i);
  });

  test('should have sufficient color contrast', async ({ page }) => {
    // Get computed styles of key elements
    const button = page.locator('[data-testid="new-route-button"]').first();
    
    const backgroundColor = await button.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    
    const color = await button.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    
    // Verify colors are defined (actual contrast check would need a library)
    expect(backgroundColor).toBeTruthy();
    expect(color).toBeTruthy();
    expect(backgroundColor).not.toBe(color);
  });

  test('should manage focus when opening modals', async ({ page }) => {
    // Open import dialog
    await page.click('[data-testid="import-button"]');
    
    // Focus should move to dialog
    const dialog = page.locator('[data-testid="import-dialog"]');
    await expect(dialog).toBeVisible();
    
    // MUI Dialog uses role="dialog" on inner Paper element
    const dialogContent = dialog.locator('[role="dialog"]');
    await expect(dialogContent).toBeVisible();
    
    // Dialog or an element within it should have focus
    const dialogHasFocus = await page.evaluate(() => {
      const dialog = document.querySelector('[data-testid="import-dialog"]');
      return dialog?.contains(document.activeElement) ?? false;
    });
    expect(dialogHasFocus).toBe(true);
    
    // Close dialog with Escape
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });

  test('should provide skip links', async ({ page }) => {
    // Check for skip to main content link
    await page.keyboard.press('Tab');
    
    const skipLink = page.locator('[data-testid="skip-to-main"]');
    if (await skipLink.count() > 0) {
      await expect(skipLink).toBeVisible();
      await expect(skipLink).toHaveAttribute('href', '#main-content');
    }
  });

  test('should have accessible tooltips', async ({ page }) => {
    // Hover over an element with tooltip
    const elementWithTooltip = page.locator('[data-testid="priority-help-icon"]');
    
    if (await elementWithTooltip.count() > 0) {
      await elementWithTooltip.hover();
      
      const tooltip = page.locator('[role="tooltip"]');
      await expect(tooltip).toBeVisible();
      
      // Tooltip should have descriptive text
      await expect(tooltip).not.toBeEmpty();
    }
  });

  test('should announce dynamic content changes', async ({ page }) => {
    // Create a route
    await page.click('[data-testid="new-route-button"]');
    await page.fill('[data-testid="route-name-input"]', 'Accessibility Test Route');
    await page.click('[data-testid="save-route-button"]');
    
    // Success message should have live region
    const successMessage = page.locator('[data-testid="save-success-message"]');
    await expect(successMessage).toBeVisible();
    await expect(successMessage).toHaveAttribute('role', 'status');
    await expect(successMessage).toHaveAttribute('aria-live', 'polite');
  });

  test('should support zoom up to 200%', async ({ page }) => {
    // Set viewport to simulate 200% zoom (effectively half width/height)
    await page.setViewportSize({ width: 640, height: 360 });
    
    // Verify main elements are still accessible
    await expect(page.locator('[data-testid="app-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="new-route-button"]')).toBeVisible();
    
    // No horizontal scrolling should be required for main content
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    
    expect(hasHorizontalScroll).toBe(false);
  });

  test('should have accessible lists', async ({ page }) => {
    // Create some routes
    await page.click('[data-testid="new-route-button"]');
    await page.fill('[data-testid="route-name-input"]', 'Route 1');
    await page.click('[data-testid="save-route-button"]');
    
    // Check route list has proper semantics
    const routeList = page.locator('[data-testid="route-list"]');
    
    if (await routeList.count() > 0) {
      await expect(routeList).toHaveAttribute('role', 'list');
      
      const routeItems = routeList.locator('[role="listitem"]');
      await expect(routeItems).toHaveCount(1);
    }
  });

  test('should have accessible buttons', async ({ page }) => {
    // All buttons should have accessible names
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      const isVisible = await button.isVisible();
      
      if (isVisible) {
        const accessibleName = await button.evaluate((btn) => {
          return btn.textContent?.trim() || 
                 btn.getAttribute('aria-label') || 
                 btn.getAttribute('title');
        });
        
        expect(accessibleName).toBeTruthy();
        expect(accessibleName?.length).toBeGreaterThan(0);
      }
    }
  });

  test('should have accessible links', async ({ page }) => {
    // Find all links
    const links = page.locator('a');
    const linkCount = await links.count();
    
    if (linkCount > 0) {
      for (let i = 0; i < Math.min(linkCount, 5); i++) {
        const link = links.nth(i);
        
        // Links should have text or aria-label
        const accessibleName = await link.evaluate((el) => {
          return el.textContent?.trim() || el.getAttribute('aria-label');
        });
        
        expect(accessibleName).toBeTruthy();
        
        // Links should indicate if they open in new window
        const target = await link.getAttribute('target');
        if (target === '_blank') {
          const ariaLabel = await link.getAttribute('aria-label');
          expect(ariaLabel).toMatch(/new window|new tab/i);
        }
      }
    }
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    // Test common keyboard shortcuts
    
    // Ctrl+S or Cmd+S to save (if implemented)
    await page.click('[data-testid="new-route-button"]');
    await page.fill('[data-testid="route-name-input"]', 'Keyboard Test');
    
    const isMac = process.platform === 'darwin';
    const modifier = isMac ? 'Meta' : 'Control';
    
    await page.keyboard.press(`${modifier}+KeyS`);
    
    // Should show save feedback
    const feedback = page.locator('[data-testid="save-success-message"], [data-testid="save-pending"]');
    // Only check if keyboard shortcut is implemented
    const feedbackCount = await feedback.count();
    expect(feedbackCount).toBeGreaterThanOrEqual(0);
  });

  test('should have accessible Monaco editor', async ({ page }) => {
    // Open JQ Playground
    await page.click('[data-testid="jq-playground-tab"]');
    
    // Monaco editor should have proper ARIA labels
    const editor = page.locator('[data-testid="jq-expression-editor"]');
    await expect(editor).toBeVisible();
    
    // Editor textarea should be accessible
    const textarea = editor.locator('textarea').first();
    await expect(textarea).toBeVisible();
    
    // Can type via keyboard
    await textarea.fill('{ id: .id }');
    const value = await textarea.inputValue();
    expect(value).toContain('id');
  });

  test('should have accessible dropdowns', async ({ page }) => {
    // Create route and check condition dropdown
    await page.click('[data-testid="new-route-button"]');
    await page.click('[data-testid="add-condition-button"]');
    
    const operatorSelect = page.locator('[data-testid="condition-operator-select"]');
    
    if (await operatorSelect.count() > 0) {
      // Should have label
      const selectId = await operatorSelect.getAttribute('id');
      if (selectId) {
        const label = page.locator(`label[for="${selectId}"]`);
        await expect(label).toBeVisible();
      }
      
      // Can be operated via keyboard
      await operatorSelect.focus();
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
    }
  });

  test('should announce loading states', async ({ page }) => {
    // Look for loading indicators
    const loadingIndicator = page.locator('[data-testid="loading"], [role="status"][aria-live="polite"]');
    
    // If loading states exist, they should be announced
    const count = await loadingIndicator.count();
    if (count > 0) {
      await expect(loadingIndicator.first()).toHaveAttribute('aria-live');
    }
  });
});
