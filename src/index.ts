import 'dotenv/config';
import { createBot } from './bot.js';
import { getActiveRound } from './game/engine.js';

async function main() {
  const token = process.env.BOT_TOKEN;
  
  if (!token) {
    console.error('❌ BOT_TOKEN environment variable is required');
    console.error('Set it with: $env:BOT_TOKEN="your-token-here" (PowerShell)');
    process.exit(1);
  }

  const { bot, db } = createBot(token);

  // Set bot commands for the menu
  await bot.api.setMyCommands([
    { command: 'start', description: 'Registrarte y recibir 100 puntos' },
    { command: 'ruleta', description: 'Iniciar una ronda de ruleta' },
    { command: 'balance', description: 'Ver tus puntos' },
    { command: 'daily', description: 'Reclamar 50 puntos gratis' },
    { command: 'top', description: 'Ranking del grupo' },
  ]);

  // Graceful shutdown
  let isShuttingDown = false;
  
  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
    
    // Stop accepting new updates
    bot.stop();
    
    // Wait a moment for in-flight updates
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Close database
    try {
      db.close();
      console.log('📦 Database closed');
    } catch (e) {
      console.error('Error closing database:', e);
    }
    
    console.log('👋 Goodbye!');
    process.exit(0);
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));

  // Start bot with polling
  console.log('🎰 Ruleta Bot starting...');
  console.log(`📂 Database: ruleta.db`);
  console.log(`🔌 Mode: polling`);
  
  bot.start({
    onStart: (botInfo) => {
      console.log(`✅ Bot @${botInfo.username} is running!`);
      console.log('─'.repeat(40));
    },
  });
}

main().catch((err) => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
