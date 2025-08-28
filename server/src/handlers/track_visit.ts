import { db } from '../db';
import { landingPageStatsTable } from '../db/schema';
import { sql } from 'drizzle-orm';

export const trackVisit = async (): Promise<{ success: boolean }> => {
  try {
    // Try to update existing record first - this handles concurrent access safely
    const updateResult = await db.execute(sql`
      UPDATE landing_page_stats 
      SET total_visits = total_visits + 1, updated_at = NOW()
      WHERE id = 1
    `);

    // If no rows were updated (no record exists), insert a new one
    if (updateResult.rowCount === 0) {
      await db.insert(landingPageStatsTable).values({
        total_visits: 1,
        total_subscriptions: 0
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Visit tracking failed:', error);
    throw error;
  }
};