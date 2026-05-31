import { Bot, Context } from 'grammy';
import type Database from 'better-sqlite3';
import * as queries from '../db/queries.js';

export function registerBalanceCommand(bot: Bot, db: Database.Database) {
  bot.command('balance', async (ctx: Context) => {
    const telegramId = String(ctx.from!.id);
    const groupId = String(ctx.chat!.id);

    const user = queries.getUser(db, telegramId, groupId);

    if (!user) {
      await ctx.reply('❌ No estás registrado. Usa /start primero.');
      return;
    }

    await ctx.reply(
      `💰 Tu Balance\n\n` +
      `👤 ${ctx.from!.first_name}\n` +
      `💎 ${user.balance} puntos\n\n` +
      `Usa /daily para reclamar 50 pts gratis cada 24h.`
    );
  });
}
