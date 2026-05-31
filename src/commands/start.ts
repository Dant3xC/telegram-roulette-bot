import { Bot, Context } from 'grammy';
import type Database from 'better-sqlite3';
import * as queries from '../db/queries.js';

export function registerStartCommand(bot: Bot, db: Database.Database) {
  bot.command('start', async (ctx: Context) => {
    const telegramId = String(ctx.from!.id);
    const username = ctx.from!.username || null;
    const firstName = ctx.from!.first_name;
    const groupId = String(ctx.chat!.id);

    // Check if user already exists
    const existing = queries.getUser(db, telegramId, groupId);

    if (existing) {
      await ctx.reply(
        `¡Ya estás registrado, ${firstName}! 🎰\n\n` +
        `💰 Tu balance: ${existing.balance} pts\n\n` +
        `Usa /ruleta para jugar, /balance para ver tus puntos.`
      );
      return;
    }

    // Create new user with 100 points
    queries.createUser(db, telegramId, username, firstName, groupId);

    await ctx.reply(
      `¡Bienvenido a la Ruleta, ${firstName}! 🎰\n\n` +
      `💰 Te regalamos 100 puntos para empezar.\n\n` +
      `📌 Comandos:\n` +
      `/ruleta — Iniciar una ronda\n` +
      `/balance — Ver tus puntos\n` +
      `/daily — Reclamar 50 pts gratis\n` +
      `/top — Ranking del grupo\n\n` +
      `¡Suerte! 🍀`
    );
  });
}
