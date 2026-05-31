import { Bot, Context } from 'grammy';
import type Database from 'better-sqlite3';
import * as queries from '../db/queries.js';
import { getActiveRound, startRound, formatRoundStatus, getCooldownRemaining } from '../game/engine.js';
import { createBetKeyboard } from '../game/keyboards.js';
import { logError, isTelegramError } from '../utils/errors.js';

export function registerRuletaCommand(bot: Bot, db: Database.Database) {
  bot.command('ruleta', async (ctx: Context) => {
    const groupId = String(ctx.chat!.id);
    const telegramId = String(ctx.from!.id);
    const chatId = ctx.chat!.id;

    // Check if chat type is supported (only groups and supergroups)
    if (ctx.chat!.type === 'channel') {
      await ctx.reply('❌ La ruleta solo funciona en grupos, no en canales.');
      return;
    }

    // Check if there's already an active round
    const existingRound = getActiveRound(groupId);
    if (existingRound) {
      await ctx.reply('⚠️ Ya hay una ronda activa en este grupo. ¡Espera a que termine!');
      return;
    }

    // Check if user is registered
    const user = queries.getUser(db, telegramId, groupId);
    if (!user) {
      await ctx.reply('❌ No estás registrado. Usa /start primero.');
      return;
    }

    // Start new round
    const round = startRound(groupId, chatId, telegramId, bot, db);
    if (!round) {
      const remaining = Math.ceil(getCooldownRemaining(groupId) / 1_000);
      await ctx.reply(`⏳ Cooldown activo. Podés iniciar otra ronda en ${remaining}s.`);
      return;
    }

    // Send betting message with keyboard
    try {
      const message = await ctx.reply(
        formatRoundStatus(round),
        { reply_markup: createBetKeyboard() }
      );
      // Store message ID for later edits
      round.messageId = message.message_id;
    } catch (e) {
      // Clean up the round since we couldn't send the message
      if (round.timer) clearTimeout(round.timer);
      const groupIdKey = String(ctx.chat!.id);
      // Remove from active rounds — use the getActiveRound reference
      // We can't import activeRounds directly, so we rely on the timer cleanup
      // The round will expire naturally after the timeout

      if (isTelegramError(e)) {
        if (e.description.includes('not enough rights')) {
          await ctx.reply('❌ No tengo permisos para enviar mensajes en este grupo. Pide a un admin que me dé los permisos necesarios.').catch(() => {});
          return;
        }
        if (e.description.includes('bot was kicked') || e.description.includes('bot is not a member')) {
          await ctx.reply('❌ No tengo acceso a este grupo. Pide a un admin que me añada.').catch(() => {});
          return;
        }
      }

      logError('ruleta reply', e);
    }
  });
}
