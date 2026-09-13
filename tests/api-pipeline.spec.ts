import { test, expect } from '@playwright/test';

test.describe('Backend API & Pipeline Tests', () => {
  test('GET /api/health reports system healthy', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.ok()).toBeTruthy();

    const data = await res.json();
    expect(data.status).toBe('healthy');
    expect(data.database.status).toBe('online');
    expect(data.database.totalArticles).toBeGreaterThan(0);
  });

  test('GET /api/articles returns paginated articles and supports category filter', async ({ request }) => {
    const res = await request.get('/api/articles?limit=5');
    expect(res.ok()).toBeTruthy();

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.articles)).toBe(true);
    expect(data.articles.length).toBeLessThanOrEqual(5);

    // Test category filter
    const cinemaRes = await request.get('/api/articles?category=cinema');
    expect(cinemaRes.ok()).toBeTruthy();
    const cinemaData = await cinemaRes.json();
    expect(cinemaData.success).toBe(true);
  });

  test('GET /api/telemetry returns autonomous crawler logs', async ({ request }) => {
    const res = await request.get('/api/telemetry');
    expect(res.ok()).toBeTruthy();

    const data = await res.json();
    expect(data.worker_id).toBeDefined();
    expect(data.total_cycles_completed).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(data.recent_logs)).toBe(true);
  });

  test('POST /api/admin/actions handles operational commands', async ({ request }) => {
    const res = await request.post('/api/admin/actions', {
      data: { action: 'resync' }
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.totalArticles).toBeGreaterThan(0);
  });
});
