import { PrismaClient } from '@prisma/client';
import { config } from './env';
 
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}
 
export const prisma =
  global.__prisma ||
  new PrismaClient({
    log: config.server.isDev ? ['error', 'warn'] : ['error'],
  });
 
if (config.server.isDev) {
  global.__prisma = prisma;
}
