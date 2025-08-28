import { db } from '../db';
import { emailSubscriptionsTable, landingPageStatsTable } from '../db/schema';
import { type SubscribeEmailInput, type EmailSubscription } from '../schema';
import { eq, sql } from 'drizzle-orm';

export const subscribeEmail = async (input: SubscribeEmailInput): Promise<EmailSubscription> => {
  try {
    // Check if email already exists
    const existingSubscription = await db.select()
      .from(emailSubscriptionsTable)
      .where(eq(emailSubscriptionsTable.email, input.email))
      .execute();

    let subscription: EmailSubscription;

    if (existingSubscription.length > 0) {
      const existing = existingSubscription[0];
      
      if (existing.is_active) {
        // Email already subscribed and active - return existing subscription
        return existing;
      } else {
        // Reactivate inactive subscription
        const reactivatedResult = await db.update(emailSubscriptionsTable)
          .set({ 
            is_active: true,
            subscribed_at: new Date() // Update subscription date
          })
          .where(eq(emailSubscriptionsTable.id, existing.id))
          .returning()
          .execute();
        
        subscription = reactivatedResult[0];
      }
    } else {
      // Create new subscription
      const newSubscriptionResult = await db.insert(emailSubscriptionsTable)
        .values({
          email: input.email,
          is_active: true
        })
        .returning()
        .execute();
      
      subscription = newSubscriptionResult[0];
    }

    // Update landing page statistics - increment total_subscriptions
    // First, try to get existing stats record
    const existingStats = await db.select()
      .from(landingPageStatsTable)
      .limit(1)
      .execute();

    if (existingStats.length > 0) {
      // Update existing stats record
      await db.update(landingPageStatsTable)
        .set({
          total_subscriptions: sql`${landingPageStatsTable.total_subscriptions} + 1`,
          updated_at: new Date()
        })
        .where(eq(landingPageStatsTable.id, existingStats[0].id))
        .execute();
    } else {
      // Create initial stats record
      await db.insert(landingPageStatsTable)
        .values({
          total_visits: 0,
          total_subscriptions: 1
        })
        .execute();
    }

    return subscription;
  } catch (error) {
    console.error('Email subscription failed:', error);
    throw error;
  }
};