import { test, expect, type Page } from '@playwright/test';

// ─── Helpers ──────────────────────────────────────────────

async function mockAuth(page: Page) {
  // In real tests, use Clerk test helpers or a test account
  // This is a placeholder for CI auth flow
  await page.goto('/auth/login');
}

// ─── Landing page SEO ─────────────────────────────────────

test.describe('SEO + meta', () => {
  test('has correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/MOVE/);
  });

  test('has description meta tag', async ({ page }) => {
    await page.goto('/');
    const desc = page.locator('meta[name="description"]');
    await expect(desc).toHaveAttribute('content', /subscription/i);
  });
});

// ─── Navigation ───────────────────────────────────────────

test.describe('Navigation', () => {
  test('login link goes to auth', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/auth/login"]');
    await expect(page).toHaveURL('/auth/login');
  });

  test('signup link goes to auth', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/auth/signup"]');
    await expect(page).toHaveURL('/auth/signup');
  });

  test('plans section is reachable', async ({ page }) => {
    await page.goto('/#plans');
    await expect(page.getByText('Simple, predictable pricing')).toBeVisible();
  });
});

// ─── Pricing display ──────────────────────────────────────

test.describe('Pricing', () => {
  test('shows all 4 plans', async ({ page }) => {
    await page.goto('/');
    for (const plan of ['Lite', 'Standard', 'Plus', 'Business']) {
      await expect(page.getByText(plan)).toBeVisible();
    }
  });

  test('shows correct prices', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('¥1,980')).toBeVisible();
    await expect(page.getByText('¥3,200')).toBeVisible();
    await expect(page.getByText('¥4,800')).toBeVisible();
    await expect(page.getByText('¥8,000')).toBeVisible();
  });

  test('Standard plan has recommended badge', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Most popular')).toBeVisible();
  });

  test('features are listed', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Utilities setup')).toBeVisible();
    await expect(page.getByText('AI room design')).toBeVisible();
  });
});

// ─── Static pages ─────────────────────────────────────────

test.describe('Static pages', () => {
  test('privacy page loads', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByText('Privacy Policy')).toBeVisible();
    await expect(page.getByText('APPI compliance')).toBeVisible();
  });

  test('terms page loads', async ({ page }) => {
    await page.goto('/terms');
    await expect(page.getByText('Terms of Service')).toBeVisible();
    await expect(page.getByText('Peak season surcharge')).toBeVisible();
  });
});

// ─── 404 handling ─────────────────────────────────────────

test.describe('Error pages', () => {
  test('404 page renders for unknown route', async ({ page }) => {
    await page.goto('/this-does-not-exist-xyz');
    await expect(page.getByText('404')).toBeVisible();
  });
});

// ─── API validation ───────────────────────────────────────

test.describe('API input validation', () => {
  test('bookings rejects empty body', async ({ request }) => {
    const res = await request.post('/api/bookings', {
      data: {},
      headers: { 'Content-Type': 'application/json' },
    });
    expect([400, 401]).toContain(res.status());
  });

  test('utilities rejects missing services', async ({ request }) => {
    const res = await request.post('/api/utilities', {
      data: { address: '1-2-3', services: [] },
      headers: { 'Content-Type': 'application/json' },
    });
    expect([400, 401]).toContain(res.status());
  });

  test('recycle rejects empty items', async ({ request }) => {
    const res = await request.post('/api/recycle', {
      data: { items: [] },
      headers: { 'Content-Type': 'application/json' },
    });
    expect([400, 401]).toContain(res.status());
  });
});

// ─── Room scanner page ────────────────────────────────────

test.describe('Room scanner', () => {
  test('redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/room-scanner');
    await expect(page).toHaveURL(/login|sign-in/);
  });
});

// ─── Mobile viewport ──────────────────────────────────────

test.describe('Mobile responsiveness', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('landing page is usable on mobile', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Moving in Japan')).toBeVisible();
    // Nav should still have key links
    await expect(page.getByText('MOVE')).toBeVisible();
  });

  test('auth pages render on mobile', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByText('MOVE')).toBeVisible();
  });
});

// ─── Performance ─────────────────────────────────────────

test.describe('Performance', () => {
  test('landing page loads within 3s', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    expect(Date.now() - start).toBeLessThan(3000);
  });
});
