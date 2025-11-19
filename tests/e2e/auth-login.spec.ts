import { test, expect } from '@playwright/test';

test.describe('User Login Flow', () => {
    let email: string;
    const password = 'Password123!';

    test.beforeAll(async ({ browser }) => {
        // Create a new context and page to register a user
        const context = await browser.newContext();
        const page = await context.newPage();

        // Listen for console logs
        page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));

        email = `testuser_${Date.now()}@example.com`;

        // Navigate to signup page
        await page.goto('/auth/signup');

        // Fill out registration form
        await page.fill('input[name="email"]', email);
        await page.fill('input[name="password"]', password);
        // Assuming there might be a confirm password or name field based on typical flows, 
        // but sticking to minimal for now. If it fails, I'll inspect the page.
        // E2ETASKS.md says "Fill in email and password fields" for Test 1.1, so likely just those.

        await page.click('button[type="submit"]');

        // Wait for redirect to dashboard to confirm registration success
        try {
            await page.waitForURL(/\/dashboard/, { timeout: 5000 });
        } catch (e) {
            console.log('Timeout waiting for dashboard redirect. Current URL:', page.url());
            const errorMsg = await page.textContent('.text-red-200');
            console.log('Error message on page:', errorMsg);
            throw e;
        }

        await context.close();
    });

    test('Login with invalid credentials', async ({ page }) => {
        await page.goto('/auth/login');

        await page.fill('input[name="email"]', 'wrong@example.com');
        await page.fill('input[name="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');

        // Verify error message is visible
        // Using a generic text locator for error, might need adjustment
        await expect(page.locator('text=Invalid email or password')).toBeVisible();
    });

    test('Login with valid credentials', async ({ page }) => {
        await page.goto('/auth/login');

        await page.fill('input[name="email"]', email);
        await page.fill('input[name="password"]', password);
        await page.click('button[type="submit"]');

        // Verify redirect to dashboard
        await expect(page).toHaveURL(/\/dashboard/);
    });

    test('Auth state persists across page refresh', async ({ page }) => {
        // Login first
        await page.goto('/auth/login');
        await page.fill('input[name="email"]', email);
        await page.fill('input[name="password"]', password);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/dashboard/);

        // Reload page
        await page.reload();

        // Verify still on dashboard (or redirected back to it)
        await expect(page).toHaveURL(/\/dashboard/);
    });
});
