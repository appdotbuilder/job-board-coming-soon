import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schema types
import { subscribeEmailInputSchema, contactInputSchema } from './schema';

// Import handlers
import { subscribeEmail } from './handlers/subscribe_email';
import { getLandingStats } from './handlers/get_landing_stats';
import { submitContact } from './handlers/submit_contact';
import { trackVisit } from './handlers/track_visit';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Email subscription endpoint for newsletter signups
  subscribeEmail: publicProcedure
    .input(subscribeEmailInputSchema)
    .mutation(({ input }) => subscribeEmail(input)),

  // Get landing page statistics (visits, subscriptions)
  getLandingStats: publicProcedure
    .query(() => getLandingStats()),

  // Contact form submission for early user feedback
  submitContact: publicProcedure
    .input(contactInputSchema)
    .mutation(({ input }) => submitContact(input)),

  // Track page visits for analytics
  trackVisit: publicProcedure
    .mutation(() => trackVisit())
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
  console.log(`Job Board Coming Soon API ready!`);
}

start();