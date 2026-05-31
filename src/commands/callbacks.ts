import { Bot, Context } from 'grammy';
import type Database from 'better-sqlite3';
import { getActiveRound, placeBet, formatRoundStatus } from '../game/engine.js';
import { createBetKeyboard, getBetLabel } from '../game/keyboards.js';
import { BetType } from '../types.js';
import { logError, isQueryTooOldError, isMessageNotModifiedError } from '../utils/errors.js';

// Selected amount per user (in-memory)
const selectedAmounts = new Map<string, number>();

export function setupCallbackHandlers(bot: Bot, db: Database.Database) {
  // Handle bet type selection
  bot.callbackQuery(/^bet:(.+)$/, async (ctx: Context) => {
    if (!ctx.from) return;
    const betType = ctx.match![1] as BetType;
    const telegramId = String(ctx.from.id);
    const groupId = String(ctx.chat!.id);

    // Get selected amount (default 10)
    const amount = selectedAmounts.get(telegramId) || 10;

    // Place bet
    const result = placeBet(groupId, telegramId, betType, amount, db);

    try {
      await ctx.answerCallbackQuery({ text: result.message, show_alert: true });
    } catch (e) {
      if (isQueryTooOldError(e)) {
        // Callback query expired — user took too long, just ignore
        return;
      }
      logError('answerCallbackQuery (bet)', e);
      return;
    }

    // Update message to show current bets
    const round = getActiveRound(groupId);
    if (round && round.messageId) {
      try {
        await ctx.api.editMessageText(
          round.chatId,
          round.messageId,
          formatRoundStatus(round),
          { reply_markup: createBetKeyboard() }
        );
      } catch (e) {
        if (isMessageNotModifiedError(e)) {
          // Message hasn't changed — ignore silently
          return;
        }
        logError('editMessageText (bet)', e);
      }
    }
  });

  // Handle amount selection
  bot.callbackQuery(/^amount:(\d+)$/, async (ctx: Context) => {
    if (!ctx.from) return;
    const amount = parseInt(ctx.match![1]);
    const telegramId = String(ctx.from.id);

    selectedAmounts.set(telegramId, amount);

    try {
      await ctx.answerCallbackQuery({ text: `💰 Monto seleccionado: ${amount} pts`, show_alert: false });
    } catch (e) {
      if (isQueryTooOldError(e)) {
        return;
      }
      logError('answerCallbackQuery (amount)', e);
    }
  });
}
