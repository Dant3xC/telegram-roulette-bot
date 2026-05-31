import { Bot, Context } from 'grammy';
import type Database from 'better-sqlite3';
import * as queries from '../db/queries.js';

export function registerTopCommand(bot: Bot, db: Database.Database) {
  bot.command('top', async (ctx: Context) => {
    const groupId = String(ctx.chat!.id);

    const topPlayers = queries.getTopPlayers(db, groupId, 10);

    if (topPlayers.length === 0) {
      await ctx.reply('🏆 No hay jugadores aún. ¡Usa /start para ser el primero!');
      return;
    }

    let message = '🏆 TOP 10 — Ruleta\n\n';

    const medals = ['🥇', '🥈', '🥉'];

    topPlayers.forEach((player, index) => {
      const medal = index < 3 ? medals[index] : `${index + 1}.`;
      const name = player.username ? `@${player.username}` : player.first_name;
      const roundsPlayed = queries.getRoundsPlayed(db, player.id);
      message += `${medal} ${name} — ${player.balance} pts (${roundsPlayed} partidas)\n`;
    });

    message += `\n📊 Total: ${topPlayers.length} jugador(es)`;

    await ctx.reply(message);
  });
}
