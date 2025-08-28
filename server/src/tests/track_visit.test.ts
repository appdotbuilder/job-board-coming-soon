import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { landingPageStatsTable } from '../db/schema';
import { trackVisit } from '../handlers/track_visit';
import { eq } from 'drizzle-orm';

describe('trackVisit', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create initial stats record when none exists', async () => {
    const result = await trackVisit();

    expect(result.success).toBe(true);

    // Verify record was created in database
    const stats = await db.select()
      .from(landingPageStatsTable)
      .execute();

    expect(stats).toHaveLength(1);
    expect(stats[0].total_visits).toBe(1);
    expect(stats[0].total_subscriptions).toBe(0);
    expect(stats[0].updated_at).toBeInstanceOf(Date);
    expect(stats[0].id).toBeDefined();
  });

  it('should increment visit count when stats record exists', async () => {
    // Create initial stats record
    await db.insert(landingPageStatsTable).values({
      total_visits: 5,
      total_subscriptions: 2
    });

    const result = await trackVisit();

    expect(result.success).toBe(true);

    // Verify visit count was incremented
    const stats = await db.select()
      .from(landingPageStatsTable)
      .execute();

    expect(stats).toHaveLength(1);
    expect(stats[0].total_visits).toBe(6); // Incremented from 5 to 6
    expect(stats[0].total_subscriptions).toBe(2); // Should remain unchanged
    expect(stats[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update timestamp on each visit', async () => {
    // Create initial record
    const initialResult = await db.insert(landingPageStatsTable).values({
      total_visits: 1,
      total_subscriptions: 0
    }).returning();

    const initialTimestamp = initialResult[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Track another visit
    await trackVisit();

    // Get updated stats
    const stats = await db.select()
      .from(landingPageStatsTable)
      .where(eq(landingPageStatsTable.id, initialResult[0].id))
      .execute();

    expect(stats[0].updated_at > initialTimestamp).toBe(true);
    expect(stats[0].total_visits).toBe(2);
  });

  it('should handle multiple concurrent visits safely', async () => {
    // Simulate concurrent visits
    const visitPromises = Array.from({ length: 10 }, () => trackVisit());
    const results = await Promise.all(visitPromises);

    // All visits should succeed
    results.forEach(result => {
      expect(result.success).toBe(true);
    });

    // Final count should be exactly 10
    const stats = await db.select()
      .from(landingPageStatsTable)
      .execute();

    expect(stats).toHaveLength(1);
    expect(stats[0].total_visits).toBe(10);
    expect(stats[0].total_subscriptions).toBe(0);
  });

  it('should preserve existing subscription count', async () => {
    // Create record with existing subscriptions
    await db.insert(landingPageStatsTable).values({
      total_visits: 100,
      total_subscriptions: 25
    });

    await trackVisit();

    const stats = await db.select()
      .from(landingPageStatsTable)
      .execute();

    expect(stats[0].total_visits).toBe(101);
    expect(stats[0].total_subscriptions).toBe(25); // Should remain unchanged
  });

  it('should handle database insertion correctly for first visit', async () => {
    // Ensure no existing records
    const initialStats = await db.select()
      .from(landingPageStatsTable)
      .execute();
    expect(initialStats).toHaveLength(0);

    // Track first visit
    const result = await trackVisit();
    expect(result.success).toBe(true);

    // Verify correct initial values
    const finalStats = await db.select()
      .from(landingPageStatsTable)
      .execute();

    expect(finalStats).toHaveLength(1);
    expect(finalStats[0].total_visits).toBe(1);
    expect(finalStats[0].total_subscriptions).toBe(0);
    expect(finalStats[0].id).toBe(1);
    expect(finalStats[0].updated_at).toBeInstanceOf(Date);
  });
});