import { z } from 'zod';

// Email subscription schema for the coming soon page
export const emailSubscriptionSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  subscribed_at: z.coerce.date(),
  is_active: z.boolean()
});

export type EmailSubscription = z.infer<typeof emailSubscriptionSchema>;

// Input schema for subscribing to updates
export const subscribeEmailInputSchema = z.object({
  email: z.string().email('Please enter a valid email address')
});

export type SubscribeEmailInput = z.infer<typeof subscribeEmailInputSchema>;

// Landing page stats schema for tracking engagement
export const landingPageStatsSchema = z.object({
  id: z.number(),
  total_visits: z.number().int().nonnegative(),
  total_subscriptions: z.number().int().nonnegative(),
  updated_at: z.coerce.date()
});

export type LandingPageStats = z.infer<typeof landingPageStatsSchema>;

// Contact/feedback schema for early users
export const contactMessageSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  message: z.string(),
  created_at: z.coerce.date(),
  is_read: z.boolean()
});

export type ContactMessage = z.infer<typeof contactMessageSchema>;

// Input schema for contact form
export const contactInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters long')
});

export type ContactInput = z.infer<typeof contactInputSchema>;