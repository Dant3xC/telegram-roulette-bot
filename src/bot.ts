import { Bot, GrammyError, HttpError } from 'grammy';
import type Database from 'better-sqlite3';
import { initDatabase } from './db/schema.js';
import { registerStartCommand } from './commands/start.js';
import { registerRuletaCommand } from './commands/ruleta.js';
import { registerBalanceCommand } from './commands/balance.js';
import { registerTopCommand } from './commands/top.js';
import { registerDailyCommand } from './commands/daily.js';
import { setupCallbackHandlers } from './commands/callbacks.js';

export function createBot(token: string): { bot: Bot; db: Database.Database } {
  const bot = new Bot(token);
  const db = initDatabase();

  // Error handler
  bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof GrammyError) {
      console.error('Error in request:', e.description);
    } else if (e instanceof HttpError) {
      console.error('Could not contact Telegram:', e);
    } else {
      console.error('Unknown error:', e);
    }
  });

  // Register commands
  registerStartCommand(bot, db);
  registerRuletaCommand(bot, db);
  registerBalanceCommand(bot, db);
  registerTopCommand(bot, db);
  registerDailyCommand(bot, db);

  // Setup callback handlers for inline keyboards
  setupCallbackHandlers(bot, db);

  return { bot, db };
}
