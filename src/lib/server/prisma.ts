import { PrismaClient } from '@prisma/client';

// Single PrismaClient across the app (and across dev HMR reloads) to avoid
// exhausting the connection pool with a new client per module.
const globalForPrisma = globalThis as unknown as { __prisma?: PrismaClient };

export const prisma = globalForPrisma.__prisma ?? new PrismaClient();

if (!globalForPrisma.__prisma) globalForPrisma.__prisma = prisma;
