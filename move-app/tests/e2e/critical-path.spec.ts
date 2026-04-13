import { test, expect } from '@playwright/test';

// ─── Landing page ─────────────────────────────────────────

test.describe('Landing page', () => {
  test('renders hero and pricing', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText("Moving in Japan, made simple.")).toBeVisible();
    await expect(page.getByText('Lite')).toBeVisible();
    await expect(page.getByText('Standard')).toBeVisible();
    await expect(page.getByText('Plus')).toBeVisible();
    await expect(page.getByText('Business')).toBeVisible();
  });

  test('pricing links go to signup', async ({ page }) => {
    await page.goto('/');
    const btn = page.locator('a[href*="/auth/signup"]').first();
    await expect(btn).toBeVisible();
  });

  test('plan features are listed', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('1 move per 2 years')).toBeVisible();
    await expect(page.getByText('Utilities setup')).toBeVisible();
    await expect(page.getByText('AI room design')).toBeVisible();
  });
});

// ─── Auth pages ───────────────────────────────────────────

test.describe('Auth pages', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByText('MOVE')).toBeVisible();
    await expect(page.getByText('Sign in to your account')).toBeVisible();
  });

  test('signup page renders', async ({ page }) => {
    await page.goto('/auth/signup');
    await expect(page.getByText('Create your account')).toBeVisible();
  });
});

// ─── Protected route redirects ────────────────────────────

test.describe('Auth protection', () => {
  test('dashboard redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/auth\/login|sign-in/);
  });

  test('booking redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/booking');
    await expect(page).toHaveURL(/auth\/login|sign-in/);
  });

  test('utilities redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/utilities');
    await expect(page).toHaveURL(/auth\/login|sign-in/);
  });

  test('room scanner redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/room-scanner');
    await expect(page).toHaveURL(/auth\/login|sign-in/);
  });
});

// ─── API routes ───────────────────────────────────────────

test.describe('API routes', () => {
  test('POST /api/bookings returns 401 without auth', async ({ request }) => {
    const res = await request.post('/api/bookings', { data: {} });
    expect(res.status()).toBe(401);
  });

  test('POST /api/utilities returns 401 without auth', async ({ request }) => {
    const res = await request.post('/api/utilities', { data: {} });
    expect(res.status()).toBe(401);
  });

  test('POST /api/ai-design returns 401 without auth', async ({ request }) => {
    const res = await request.post('/api/ai-design', { data: {} });
    expect(res.status()).toBe(401);
  });

  test('POST /api/subscriptions returns 401 without auth', async ({ request }) => {
    const res = await request.post('/api/subscriptions', { data: {} });
    expect(res.status()).toBe(401);
  });

  test('POST /api/recycle returns 401 without auth', async ({ request }) => {
    const res = await request.post('/api/recycle', { data: {} });
    expect(res.status()).toBe(401);
  });
});

// ─── Room Scanner page (unauthenticated redirect) ─────────

test.describe('Room scanner', () => {
  test('page redirects without auth', async ({ page }) => {
    await page.goto('/room-scanner');
    await expect(page).toHaveURL(/auth\/login|sign-in/);
  });
});
