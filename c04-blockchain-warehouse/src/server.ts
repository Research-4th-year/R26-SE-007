import { config } from './config/env';
import { prisma } from './config/prisma';
import app from './app';
 
const PORT = config.server.port;
 
async function bootstrap() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  }
 
  const server = app.listen(PORT, () => {
    console.log(`\n🚀 Paddy Backend running`);
    console.log(`   Env    : ${config.server.nodeEnv}`);
    console.log(`   Port   : ${PORT}`);
    console.log(`   Health : http://localhost:${PORT}/health`);
    console.log(`   Auth   : http://localhost:${PORT}/api/auth\n`);
  });
 
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} — shutting down...`);
    server.close(async () => {
      await prisma.$disconnect();
      console.log('✅ Shutdown complete');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000);
  };
 
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => console.error('Unhandled rejection:', reason));
  process.on('uncaughtException',  (err)    => { console.error('Uncaught exception:', err); process.exit(1); });
}
 
bootstrap();
