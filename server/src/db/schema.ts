import { serial, text, pgTable, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

// Email subscriptions table for newsletter signups
export const emailSubscriptionsTable = pgTable('email_subscriptions', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(), // Unique constraint for email addresses
  subscribed_at: timestamp('subscribed_at').defaultNow().notNull(),
  is_active: boolean('is_active').default(true).notNull() // Allow unsubscribing
});

// Landing page statistics table for tracking engagement
export const landingPageStatsTable = pgTable('landing_page_stats', {
  id: serial('id').primaryKey(),
  total_visits: integer('total_visits').default(0).notNull(),
  total_subscriptions: integer('total_subscriptions').default(0).notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Contact messages table for early feedback
export const contactMessagesTable = pgTable('contact_messages', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  message: text('message').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  is_read: boolean('is_read').default(false).notNull()
});

// TypeScript types for the table schemas
export type EmailSubscription = typeof emailSubscriptionsTable.$inferSelect;
export type NewEmailSubscription = typeof emailSubscriptionsTable.$inferInsert;

export type LandingPageStats = typeof landingPageStatsTable.$inferSelect;
export type NewLandingPageStats = typeof landingPageStatsTable.$inferInsert;

export type ContactMessage = typeof contactMessagesTable.$inferSelect;
export type NewContactMessage = typeof contactMessagesTable.$inferInsert;

// Export all tables for proper query building
export const tables = { 
  emailSubscriptions: emailSubscriptionsTable,
  landingPageStats: landingPageStatsTable,
  contactMessages: contactMessagesTable
};