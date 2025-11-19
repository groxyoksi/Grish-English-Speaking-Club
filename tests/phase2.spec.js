import { test, expect } from '@playwright/test';

/**
 * Phase 2 Feature Tests for Grish English Speaking Club
 * 
 * Tests all 5 Phase 2 features:
 * 1. Progress Tracking
 * 2. Filter & Sort
 * 3. Duplicate Session (Admin)
 * 4. Session Preview (Admin)
 * 5. Undo Delete (Admin)
 */

// Test credentials - UPDATE THESE!
const STUDENT_EMAIL = 'student@test.com';
const STUDENT_PASSWORD = 'testpassword123';
const ADMIN_EMAIL = 'oksuzian.grigorii@gmail.com';
const ADMIN_PASSWORD = 'your-admin-password'; // UPDATE THIS!

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function loginAsStudent(page) {
  await page.goto('/');
  await page.click('#loginBtn');
  await page.fill('#loginEmail', STUDENT_EMAIL);
  await page.fill('#loginPassword', STUDENT_PASSWORD);
  await page.click('button:has-text("Login")');
  await page.waitForSelector('#userBtn', { timeout: 10000 });
}

async function loginAsAdmin(page) {
  await page.goto('/');
  await page.click('#loginBtn');
  await page.fill('#loginEmail', ADMIN_EMAIL);
  await page.fill('#loginPassword', ADMIN_PASSWORD);
  await page.click('button:has-text("Login")');
  await page.waitForSelector('#adminBtn', { timeout: 10000 });
}

async function logout(page) {
  await page.click('#userBtn');
  await page.click('button:has-text("Logout")');
}

// ============================================================================
// TEST SUITE: PROGRESS TRACKING
// ============================================================================

test.describe('Progress Tracking', () => {
  
  test('should show mark complete button when logged in', async ({ page }) => {
    await loginAsStudent(page);
    
    // Click first session
    await page.click('.session-box:first-child');
    
    // Should see mark complete button
    const completeBtn = page.locator('button.mark-complete-btn');
    await expect(completeBtn).toBeVisible();
    await expect(completeBtn).toContainText('Mark as Complete');
  });

  test('should mark session as complete and show badge', async ({ page }) => {
    await loginAsStudent(page);
    
    // Open first session
    await page.click('.session-box:first-child');
    
    // Click mark complete
    await page.click('button.mark-complete-btn');
    
    // Should see success toast
    await expect(page.locator('.toast-success')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.toast-success')).toContainText('completed');
    
    // Go back to main page
    await page.click('.back-btn');
    
    // Should see complete badge on session
    await expect(page.locator('.complete-badge').first()).toBeVisible();
    await expect(page.locator('.complete-badge').first()).toContainText('Completed');
  });

  test('should toggle completion status', async ({ page }) => {
    await loginAsStudent(page);
    
    // Open session
    await page.click('.session-box:first-child');
    
    // Mark complete
    await page.click('button.mark-complete-btn');
    await page.waitForSelector('.toast-success');
    
    // Wait for button to update
    await page.waitForTimeout(1000);
    
    // Button should now say "Completed"
    const completeBtn = page.locator('button.mark-complete-btn');
    await expect(completeBtn).toContainText('Completed');
    
    // Click again to mark incomplete
    await page.click('button.mark-complete-btn');
    
    // Should see info toast
    await expect(page.locator('.toast-info')).toBeVisible({ timeout: 5000 });
    
    // Button should say "Mark as Complete" again
    await page.waitForTimeout(1000);
    await expect(completeBtn).toContainText('Mark as Complete');
  });

  test('should persist completion after page reload', async ({ page }) => {
    await loginAsStudent(page);
    
    // Mark first session complete
    await page.click('.session-box:first-child');
    await page.click('button.mark-complete-btn');
    await page.waitForSelector('.toast-success');
    await page.click('.back-btn');
    
    // Reload page
    await page.reload();
    await page.waitForSelector('.session-box');
    
    // Badge should still be there
    await expect(page.locator('.complete-badge').first()).toBeVisible();
  });
});

// ============================================================================
// TEST SUITE: FILTER & SORT
// ============================================================================

test.describe('Filter & Sort', () => {
  
  test('should show filter and sort controls when logged in', async ({ page }) => {
    await loginAsStudent(page);
    
    // Should see controls below search
    await expect(page.locator('.filter-group')).toBeVisible();
    await expect(page.locator('.sort-group')).toBeVisible();
  });

  test('should filter to completed sessions only', async ({ page }) => {
    await loginAsStudent(page);
    
    // Count initial sessions
    const initialCount = await page.locator('.session-box').count();
    
    // Change filter to completed
    await page.selectOption('.filter-select', 'completed');
    
    // Wait for update
    await page.waitForTimeout(500);
    
    // Should see toast notification
    await expect(page.locator('.toast-info')).toBeVisible();
    
    // All visible sessions should have complete badge
    const visibleSessions = await page.locator('.session-box').count();
    const completeBadges = await page.locator('.complete-badge').count();
    
    expect(visibleSessions).toBe(completeBadges);
  });

  test('should filter to incomplete sessions only', async ({ page }) => {
    await loginAsStudent(page);
    
    // Change filter to incomplete
    await page.selectOption('.filter-select', 'incomplete');
    
    // Wait for update
    await page.waitForTimeout(500);
    
    // Should NOT see any complete badges
    const badges = await page.locator('.complete-badge').count();
    expect(badges).toBe(0);
  });

  test('should sort by oldest first', async ({ page }) => {
    await loginAsStudent(page);
    
    // Get first session date before sorting
    const firstSessionBefore = await page.locator('.session-box:first-child h2').textContent();
    
    // Change sort to oldest
    await page.selectOption('.sort-select', 'date-asc');
    
    // Wait for update
    await page.waitForTimeout(500);
    
    // First session date should be different (oldest)
    const firstSessionAfter = await page.locator('.session-box:first-child h2').textContent();
    
    expect(firstSessionBefore).not.toBe(firstSessionAfter);
  });

  test('should combine filter and sort', async ({ page }) => {
    await loginAsStudent(page);
    
    // Filter to completed
    await page.selectOption('.filter-select', 'completed');
    await page.waitForTimeout(500);
    
    // Sort by oldest
    await page.selectOption('.sort-select', 'date-asc');
    await page.waitForTimeout(500);
    
    // Should only show completed sessions, oldest first
    const sessions = await page.locator('.session-box').count();
    const badges = await page.locator('.complete-badge').count();
    
    expect(sessions).toBe(badges);
  });
});

// ============================================================================
// TEST SUITE: DUPLICATE SESSION (Admin)
// ============================================================================

test.describe('Duplicate Session (Admin)', () => {
  
  test('should show duplicate button in admin panel', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Open admin panel
    await page.click('#adminBtn');
    await page.waitForSelector('#adminPanel');
    
    // Scroll to existing sessions
    await page.evaluate(() => {
      document.querySelector('.sessions-list').scrollIntoView();
    });
    
    // Should see duplicate buttons
    const duplicateBtns = await page.locator('button:has-text("Duplicate")').count();
    expect(duplicateBtns).toBeGreaterThan(0);
  });

  test('should duplicate session successfully', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Open admin panel
    await page.click('#adminBtn');
    await page.waitForSelector('#adminPanel');
    
    // Count existing sessions
    const initialCount = await page.locator('.session-list-item').count();
    
    // Click duplicate on first session
    await page.click('.session-list-item:first-child button:has-text("Duplicate")');
    
    // Should see success toast
    await expect(page.locator('.toast-success')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.toast-success')).toContainText('duplicated');
    
    // Wait for panel to refresh
    await page.waitForTimeout(1000);
    
    // Should have one more session
    const newCount = await page.locator('.session-list-item').count();
    expect(newCount).toBe(initialCount + 1);
  });
});

// ============================================================================
// TEST SUITE: SESSION PREVIEW (Admin)
// ============================================================================

test.describe('Session Preview (Admin)', () => {
  
  test('should show preview button in admin form', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Open admin panel
    await page.click('#adminBtn');
    await page.waitForSelector('#adminPanel');
    
    // Should see preview button
    await expect(page.locator('button:has-text("Preview")')).toBeVisible();
  });

  test('should open preview modal with content', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Open admin panel
    await page.click('#adminBtn');
    await page.waitForSelector('#adminPanel');
    
    // Fill in date
    await page.fill('#sessionDate', '2025-12-01');
    
    // Fill in notes
    await page.fill('#notesText', `TEST WORD
This is a test definition
Example sentence here
====
SECOND WORD
Another definition
Another example`);
    
    // Click preview
    await page.click('button:has-text("Preview")');
    
    // Should see preview modal
    await expect(page.locator('.preview-modal')).toBeVisible();
    await expect(page.locator('.preview-badge')).toContainText('NOT SAVED');
    
    // Should show parsed content
    await expect(page.locator('.note-item')).toHaveCount(2);
  });

  test('should close preview modal', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Open admin panel and preview
    await page.click('#adminBtn');
    await page.fill('#sessionDate', '2025-12-01');
    await page.fill('#notesText', 'TEST\ntest definition');
    await page.click('button:has-text("Preview")');
    
    // Modal should be visible
    await expect(page.locator('.preview-modal')).toBeVisible();
    
    // Click close button
    await page.click('.preview-close');
    
    // Modal should be gone
    await expect(page.locator('.preview-modal')).not.toBeVisible();
  });

  test('should show error if preview without date', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Open admin panel
    await page.click('#adminBtn');
    
    // Try to preview without date
    await page.click('button:has-text("Preview")');
    
    // Should see error toast
    await expect(page.locator('.toast-error')).toBeVisible();
    await expect(page.locator('.toast-error')).toContainText('date');
  });
});

// ============================================================================
// TEST SUITE: UNDO DELETE (Admin)
// ============================================================================

test.describe('Undo Delete (Admin)', () => {
  
  test('should show undo toast after deletion', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Open admin panel
    await page.click('#adminBtn');
    await page.waitForSelector('#adminPanel');
    
    // Accept the confirmation dialog
    page.on('dialog', dialog => dialog.accept());
    
    // Click delete on last session (safer for testing)
    await page.click('.session-list-item:last-child button:has-text("Delete")');
    
    // Should see undo toast
    await expect(page.locator('.toast-undo')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.toast-undo-btn')).toBeVisible();
  });

  test('should restore session when undo clicked', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Open admin panel
    await page.click('#adminBtn');
    const initialCount = await page.locator('.session-list-item').count();
    
    // Delete session
    page.on('dialog', dialog => dialog.accept());
    await page.click('.session-list-item:last-child button:has-text("Delete")');
    
    // Click undo
    await page.click('.toast-undo-btn');
    
    // Should see success toast
    await expect(page.locator('.toast-success')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.toast-success')).toContainText('restored');
    
    // Wait for panel to refresh
    await page.waitForTimeout(1000);
    
    // Session count should be same
    const newCount = await page.locator('.session-list-item').count();
    expect(newCount).toBe(initialCount);
  });
});

// ============================================================================
// TEST SUITE: MOBILE RESPONSIVE
// ============================================================================

test.describe('Mobile Responsive', () => {
  
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size
  
  test('should show progress features on mobile', async ({ page }) => {
    await loginAsStudent(page);
    
    // Click session
    await page.click('.session-box:first-child');
    
    // Mark complete button should be visible and tap-friendly
    const completeBtn = page.locator('.mark-complete-btn');
    await expect(completeBtn).toBeVisible();
    
    // Button should be full width or large enough
    const box = await completeBtn.boundingBox();
    expect(box.height).toBeGreaterThan(40); // Minimum tap target
  });

  test('should stack filter controls vertically on mobile', async ({ page }) => {
    await loginAsStudent(page);
    
    // Controls should be visible
    await expect(page.locator('.filter-group')).toBeVisible();
    await expect(page.locator('.sort-group')).toBeVisible();
    
    // Should be stacked (one on top of other)
    const filterBox = await page.locator('.filter-group').boundingBox();
    const sortBox = await page.locator('.sort-group').boundingBox();
    
    // Sort should be below filter (higher Y coordinate)
    expect(sortBox.y).toBeGreaterThan(filterBox.y);
  });
});

// ============================================================================
// TEST SUITE: DARK MODE
// ============================================================================

test.describe('Dark Mode Support', () => {
  
  test('should support dark mode for all Phase 2 features', async ({ page }) => {
    await loginAsStudent(page);
    
    // Toggle dark mode
    await page.click('#themeToggle');
    
    // Check dark mode is active
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'dark');
    
    // Complete badge should be visible
    await page.click('.session-box:first-child');
    await page.click('.mark-complete-btn');
    await page.click('.back-btn');
    
    await expect(page.locator('.complete-badge')).toBeVisible();
    
    // Filter controls should be visible
    await expect(page.locator('.filter-select')).toBeVisible();
  });
});
