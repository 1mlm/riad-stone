import { PrismaPg } from "@prisma/adapter-pg";
import type { ITXClientDenyList } from "@prisma/client/runtime/client";
import { PrismaClient } from "@/generated/prisma/client";

// our Prisma Postgres instance is on the free plan, which scales compute to
// zero when idle — the first query after a quiet stretch can lose the wake-up
// race and get this exact error back instead of waiting for compute to come
// up. it always resolves within a second or two, so one retry rides it out.
const TRANSIENT_CONNECTION_ERROR =
  "Failed to connect to upstream database. Please contact Prisma support if the problem persists.";
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 500;

function isColdStartConnectionError(error: unknown) {
  return (
    error instanceof Error && error.message.includes(TRANSIENT_CONNECTION_ERROR)
  );
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter }).$extends({
    query: {
      async $allOperations({ query, args }) {
        for (let attempt = 1; ; attempt++) {
          try {
            return await query(args);
          } catch (error) {
            if (!isColdStartConnectionError(error) || attempt >= MAX_ATTEMPTS) {
              throw error;
            }
            await wait(RETRY_DELAY_MS * attempt);
          }
        }
      },
    },
  });
}

declare global {
  var prismaClient: ReturnType<typeof createPrismaClient> | undefined;
}

export const prisma = globalThis.prismaClient ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalThis.prismaClient = prisma;

// the extension above changes what `prisma.$transaction(async (tx) => ...)`
// hands back, so callers typing their callback's `tx` param need this instead
// of the generated client's own (now mismatched) `Prisma.TransactionClient`
export type PrismaTransactionClient = Omit<typeof prisma, ITXClientDenyList>;
