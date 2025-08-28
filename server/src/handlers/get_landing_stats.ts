import { db } from '../db';
import { landingPageStatsTable } from '../db/schema';
import { type LandingPageStats } from '../schema';
import { desc } from 'drizzle-orm';

export const getLandingStats = async (): Promise<LandingPageStats> => {
  try {
    // Try to get the most recent stats record
    const existingStats = await db.select()
      .from(landingPageStatsTable)
      .orderBy(desc(landingPageStatsTable.updated_at))
      .limit(1)
      .execute();

    // If stats exist, return the latest record
    if (existingStats.length > 0) {
      return existingStats[0];
    }

    // If no stats exist, create initial record with zeros
    const initialStats = await db.insert(landingPageStatsTable)
      .values({
        total_visits: 0,
        total_subscriptions: 0
      })
      .returning()
      .execute();

    return initialStats[0];
  } catch (error) {
    console.error('Failed to get landing stats:', error);
    throw error;
  }
};