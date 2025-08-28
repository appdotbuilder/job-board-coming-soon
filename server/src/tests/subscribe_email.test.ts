import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { emailSubscriptionsTable, landingPageStatsTable } from '../db/schema';
import { type SubscribeEmailInput } from '../schema';
import { subscribeEmail } from '../handlers/subscribe_email';
import { eq } from 'drizzle-orm';

const testInput: SubscribeEmailInput = {
  email: 'test@example.com'
};

const testInput2: SubscribeEmailInput = {
  email: 'user2@example.com'
};

describe('subscribeEmail', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create new email subscription', async () => {
    const result = await subscribeEmail(testInput);

    expect(result.email).toEqual('test@example.com');
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.subscribed_at).toBeInstanceOf(Date);
  });

  it('should save subscription to database', async () => {
    const result = await subscribeEmail(testInput);

    const subscriptions = await db.select()
      .from(emailSubscriptionsTable)
      .where(eq(emailSubscriptionsTable.id, result.id))
      .execute();

    expect(subscriptions).toHaveLength(1);
    expect(subscriptions[0].email).toEqual('test@example.com');
    expect(subscriptions[0].is_active).toBe(true);
    expect(subscriptions[0].subscribed_at).toBeInstanceOf(Date);
  });

  it('should return existing active subscription without creating duplicate', async () => {
    // First subscription
    const first = await subscribeEmail(testInput);
    
    // Second attempt with same email
    const second = await subscribeEmail(testInput);

    expect(first.id).toEqual(second.id);
    expect(first.email).toEqual(second.email);
    expect(first.subscribed_at).toEqual(second.subscribed_at);

    // Verify only one record exists
    const allSubscriptions = await db.select()
      .from(emailSubscriptionsTable)
      .where(eq(emailSubscriptionsTable.email, testInput.email))
      .execute();

    expect(allSubscriptions).toHaveLength(1);
  });

  it('should reactivate inactive subscription', async () => {
    // Create an inactive subscription first
    const inactiveSubscription = await db.insert(emailSubscriptionsTable)
      .values({
        email: testInput.email,
        is_active: false,
        subscribed_at: new Date('2023-01-01')
      })
      .returning()
      .execute();

    const originalDate = inactiveSubscription[0].subscribed_at;

    // Subscribe with same email - should reactivate
    const result = await subscribeEmail(testInput);

    expect(result.id).toEqual(inactiveSubscription[0].id);
    expect(result.is_active).toBe(true);
    expect(result.email).toEqual(testInput.email);
    expect(result.subscribed_at).not.toEqual(originalDate); // Should update subscription date

    // Verify in database
    const updatedSubscription = await db.select()
      .from(emailSubscriptionsTable)
      .where(eq(emailSubscriptionsTable.id, result.id))
      .execute();

    expect(updatedSubscription[0].is_active).toBe(true);
    expect(updatedSubscription[0].subscribed_at).not.toEqual(originalDate);
  });

  it('should increment landing page stats for new subscription', async () => {
    // Create initial stats record
    await db.insert(landingPageStatsTable)
      .values({
        total_visits: 10,
        total_subscriptions: 5
      })
      .execute();

    await subscribeEmail(testInput);

    const stats = await db.select()
      .from(landingPageStatsTable)
      .execute();

    expect(stats).toHaveLength(1);
    expect(stats[0].total_visits).toEqual(10); // Should remain unchanged
    expect(stats[0].total_subscriptions).toEqual(6); // Should increment by 1
    expect(stats[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create initial stats record if none exists', async () => {
    // Ensure no stats record exists
    const initialStats = await db.select().from(landingPageStatsTable).execute();
    expect(initialStats).toHaveLength(0);

    await subscribeEmail(testInput);

    const stats = await db.select()
      .from(landingPageStatsTable)
      .execute();

    expect(stats).toHaveLength(1);
    expect(stats[0].total_visits).toEqual(0);
    expect(stats[0].total_subscriptions).toEqual(1);
    expect(stats[0].updated_at).toBeInstanceOf(Date);
  });

  it('should not increment stats for existing active subscription', async () => {
    // Create initial stats
    await db.insert(landingPageStatsTable)
      .values({
        total_visits: 10,
        total_subscriptions: 5
      })
      .execute();

    // First subscription - should increment stats
    await subscribeEmail(testInput);
    
    let stats = await db.select().from(landingPageStatsTable).execute();
    expect(stats[0].total_subscriptions).toEqual(6);

    // Second attempt with same email - should NOT increment stats
    await subscribeEmail(testInput);
    
    stats = await db.select().from(landingPageStatsTable).execute();
    expect(stats[0].total_subscriptions).toEqual(6); // Should remain the same
  });

  it('should handle multiple unique subscriptions correctly', async () => {
    // Subscribe two different emails
    const result1 = await subscribeEmail(testInput);
    const result2 = await subscribeEmail(testInput2);

    expect(result1.email).toEqual('test@example.com');
    expect(result2.email).toEqual('user2@example.com');
    expect(result1.id).not.toEqual(result2.id);

    // Verify both are in database
    const allSubscriptions = await db.select()
      .from(emailSubscriptionsTable)
      .execute();

    expect(allSubscriptions).toHaveLength(2);
    expect(allSubscriptions.map(s => s.email)).toContain('test@example.com');
    expect(allSubscriptions.map(s => s.email)).toContain('user2@example.com');

    // Verify stats incremented twice
    const stats = await db.select().from(landingPageStatsTable).execute();
    expect(stats[0].total_subscriptions).toEqual(2);
  });

  it('should increment stats when reactivating inactive subscription', async () => {
    // Create initial stats
    await db.insert(landingPageStatsTable)
      .values({
        total_visits: 10,
        total_subscriptions: 5
      })
      .execute();

    // Create inactive subscription
    await db.insert(emailSubscriptionsTable)
      .values({
        email: testInput.email,
        is_active: false
      })
      .execute();

    // Reactivate subscription
    await subscribeEmail(testInput);

    const stats = await db.select().from(landingPageStatsTable).execute();
    expect(stats[0].total_subscriptions).toEqual(6); // Should increment
  });
});