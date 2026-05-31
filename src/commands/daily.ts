import { Bot, Context } from 'grammy';
import type Database from 'better-sqlite3';
import * as queries from '../db/queries.js';

const DAILY_AMOUNT = 50;
const COOLDOWN_HOURS = 24;

export function registerDailyCommand(bot: Bot, db: Database.Database) {
  bot.command('daily', async (ctx: Context) => {
    const telegramId = String(ctx.from!.id);
    const groupId = String(ctx.chat!.id);

    const user = queries.getUser(db, telegramId, groupId);

    if (!user) {
      await ctx.reply('❌ No estás registrado. Usa /start primero.');
      return;
    }

    // Check cooldown
    if (user.last_daily) {
      const lastDaily = new Date(user.last_daily);
      const now = new Date();
      const hoursDiff = (now.getTime() - lastDaily.getTime()) / (1000 * 60 * 60);

      if (hoursDiff < COOLDOWN_HOURS) {
        const remaining = Math.ceil(COOLDOWN_HOURS - hoursDiff);
        await ctx.reply(
          `⏰ Ya reclamaste tu bonus diario.\n` +
          `Próximo reclamo en: ${remaining} hora(s)`
        );
        return;
      }
    }

    // Give daily bonus
    queries.updateBalance(db, telegramId, groupId, DAILY_AMOUNT);
    queries.updateLastDaily(db, telegramId, groupId);

    const newBalance = queries.getBalance(db, telegramId, groupId);

    await ctx.reply(
      `🎁 ¡Bonus diario reclamado!\n\n` +
      `+${DAILY_AMOUNT} pts\n` +
      `💰 Balance actual: ${newBalance} pts`
    );
  });
}
