import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { landingPageStatsTable } from '../db/schema';
import { getLandingStats } from '../handlers/get_landing_stats';

describe('getLandingStats', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create initial stats record when none exists', async () => {
    const result = await getLandingStats();

    // Verify initial values
    expect(result.total_visits).toEqual(0);
    expect(result.total_subscriptions).toEqual(0);
    expect(result.id).toBeDefined();
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save initial stats to database', async () => {
    const result = await getLandingStats();

    // Verify it was saved to database
    const statsInDb = await db.select()
      .from(landingPageStatsTable)
      .execute();

    expect(statsInDb).toHaveLength(1);
    expect(statsInDb[0].id).toEqual(result.id);
    expect(statsInDb[0].total_visits).toEqual(0);
    expect(statsInDb[0].total_subscriptions).toEqual(0);
    expect(statsInDb[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return existing stats when they exist', async () => {
    // First, create some stats in the database
    await db.insert(landingPageStatsTable)
      .values({
        total_visits: 150,
        total_subscriptions: 25
      })
      .execute();

    const result = await getLandingStats();

    // Should return existing stats, not create new ones
    expect(result.total_visits).toEqual(150);
    expect(result.total_subscriptions).toEqual(25);
    expect(result.id).toBeDefined();
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should return most recent stats when multiple records exist', async () => {
    // Create older stats record
    await db.insert(landingPageStatsTable)
      .values({
        total_visits: 100,
        total_subscriptions: 10
      })
      .execute();

    // Wait a bit to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Create newer stats record
    await db.insert(landingPageStatsTable)
      .values({
        total_visits: 200,
        total_subscriptions: 30
      })
      .execute();

    const result = await getLandingStats();

    // Should return the most recent stats (200 visits, 30 subscriptions)
    expect(result.total_visits).toEqual(200);
    expect(result.total_subscriptions).toEqual(30);
    expect(result.id).toBeDefined();
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should only create one record when called multiple times with no existing data', async () => {
    // Call multiple times
    const result1 = await getLandingStats();
    const result2 = await getLandingStats();

    // Both should return the same record
    expect(result1.id).toEqual(result2.id);
    expect(result1.total_visits).toEqual(result2.total_visits);
    expect(result1.total_subscriptions).toEqual(result2.total_subscriptions);

    // Verify only one record exists in database
    const allStats = await db.select()
      .from(landingPageStatsTable)
      .execute();

    expect(allStats).toHaveLength(1);
  });
});