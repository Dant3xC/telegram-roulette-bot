import { ActiveRound, BetType, RoundState } from '../types.js';
import { spin, calculatePayout, formatResult } from './roulette.js';
import { createBetKeyboard, getBetLabel } from './keyboards.js';
import type { Bot, Context } from 'grammy';
import type Database from 'better-sqlite3';
import * as queries from '../db/queries.js';
import { logError, isMessageNotModifiedError } from '../utils/errors.js';

const BETTING_DURATION_MS = 30_000; // 30 seconds
const MESSAGE_EDIT_THROTTLE_MS = 1_000; // 1 edit per second
const ROUND_COOLDOWN_MS = 10_000; // 10 seconds cooldown between rounds per group

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// In-memory active rounds per group
const activeRounds = new Map<string, ActiveRound>();

// Cooldown tracking: groupId → timestamp when cooldown expires
const roundCooldowns = new Map<string, number>();

export function isOnCooldown(groupId: string): boolean {
  const until = roundCooldowns.get(groupId);
  if (!until) return false;
  if (Date.now() >= until) {
    roundCooldowns.delete(groupId);
    return false;
  }
  return true;
}

export function getCooldownRemaining(groupId: string): number {
  const until = roundCooldowns.get(groupId);
  if (!until) return 0;
  return Math.max(0, until - Date.now());
}

// Get active round for a group
export function getActiveRound(groupId: string): ActiveRound | undefined {
  return activeRounds.get(groupId);
}

// Start a new round
export function startRound(
  groupId: string,
  chatId: number,
  startedBy: string,
  bot: Bot,
  db: Database.Database
): ActiveRound | null {
  if (isOnCooldown(groupId)) {
    return null;
  }

  const round: ActiveRound = {
    state: 'BETTING',
    groupId,
    startedBy,
    bets: new Map(),
    timer: null,
    messageId: null,
    chatId,
  };

  activeRounds.set(groupId, round);

  // Auto-spin after 30 seconds
  round.timer = setTimeout(() => {
    finishBettingPhase(groupId, bot, db);
  }, BETTING_DURATION_MS);

  return round;
}

// Place a bet (returns true if successful)
export function placeBet(
  groupId: string,
  telegramId: string,
  betType: BetType,
  amount: number,
  db: Database.Database
): { success: boolean; message: string } {
  const round = activeRounds.get(groupId);

  if (!round || round.state !== 'BETTING') {
    return { success: false, message: '❌ No hay ronda activa o las apuestas están cerradas.' };
  }

  // Validate amount is positive
  if (amount <= 0) {
    return { success: false, message: '❌ El monto debe ser mayor a 0.' };
  }

  // Validate user has enough balance
  const balance = queries.getBalance(db, telegramId, groupId);
  if (balance === null) {
    return { success: false, message: '❌ No estás registrado. Usa /saldo para registrarte.' };
  }
  if (amount > balance) {
    return { success: false, message: `❌ Saldo insuficiente. Tenés ${balance} pts, querés apostar ${amount} pts.` };
  }

  // Store/update bet (last bet per user counts)
  round.bets.set(telegramId, { userId: telegramId, betType, amount });

  return { success: true, message: `✅ Apuesta registrada: ${getBetLabel(betType)} por ${amount} pts` };
}

// End betting phase and spin
async function finishBettingPhase(groupId: string, bot: Bot, db: Database.Database) {
  const round = activeRounds.get(groupId);
  if (!round) return;

  round.state = 'SPINNING';

  // 1. Send dice for launch effect (non-blocking, just for fun)
  try {
    await bot.api.sendDice(round.chatId, '🎰');
  } catch (e) {
    logError('sendDice', e);
  }

  // 2. Wait a moment for the dice to appear
  await sleep(2000);

  // 3. Pre-generate the result
  const resultNumber = spin();

  // 4. Deceleration animation with random numbers
  const allNumbers = Array.from({ length: 37 }, (_, i) => i);
  const delays = [300, 300, 300, 400, 500, 700, 1000, 1200]; // increasing delays

  // Generate frames: random numbers that slow down, last one is the real result
  const frames: string[] = [];
  for (let i = 0; i < delays.length - 1; i++) {
    const count = Math.max(3, 8 - i); // fewer numbers as it slows down
    const nums = [];
    for (let j = 0; j < count; j++) {
      nums.push(allNumbers[Math.floor(Math.random() * allNumbers.length)]);
    }
    frames.push(nums.join(' · '));
  }
  // Last frame shows the real result
  frames.push(formatResult(resultNumber));

  // 5. Show the deceleration
  if (round.messageId) {
    for (let i = 0; i < frames.length; i++) {
      try {
        const label = i === frames.length - 1 ? '🎯 ¡PARÓ!' : '🎰 Girando...';
        await bot.api.editMessageText(
          round.chatId,
          round.messageId,
          `${label}\n\n${frames[i]}`
        );
      } catch (e) {
        if (!isMessageNotModifiedError(e)) {
          logError('editMessageText (spin animation)', e);
        }
      }
      if (i < delays.length - 1) {
        await sleep(delays[i]);
      }
    }
  }

  // Resolve after final frame
  await resolveRound(groupId, bot, db, resultNumber);
}

// Resolve the round — calculate payouts
async function resolveRound(groupId: string, bot: Bot, db: Database.Database, resultNumber: number) {
  const round = activeRounds.get(groupId);
  if (!round) return;

  round.state = 'RESULT';

  // Save round to DB
  const roundDb = queries.createRound(db, groupId, resultNumber, round.startedBy);

  // Calculate payouts and update balances (wrapped in transaction for atomicity)
  const results: { name: string; betType: BetType; amount: number; payout: number }[] = [];

  const resolveAllBets = db.transaction(() => {
    for (const [telegramId, bet] of round.bets) {
      const user = queries.getUser(db, telegramId, groupId);
      if (!user) continue;

      const payout = calculatePayout(bet.betType, bet.amount, resultNumber);

      // Update balance: subtract bet, add payout
      const netChange = payout - bet.amount;
      queries.updateBalance(db, telegramId, groupId, netChange);

      // Save bet to DB
      queries.createBet(db, roundDb.id, user.id, bet.betType, bet.amount);

      results.push({
        name: user.username ? '@' + user.username : user.first_name,
        betType: bet.betType,
        amount: bet.amount,
        payout,
      });
    }
  });

  resolveAllBets();

  // Build result message
  const resultEmoji = formatResult(resultNumber);
  let message = `🎯 RESULTADO: ${resultEmoji}\n\n`;

  if (results.length === 0) {
    message += '😢 Nadie apostó esta ronda.';
  } else {
    message += '📋 Resultados:\n';
    for (const r of results) {
      if (r.payout > 0) {
        message += `  ✅ ${r.name}: ${getBetLabel(r.betType)} ${r.amount} pts → +${r.payout} pts\n`;
      } else {
        message += `  ❌ ${r.name}: ${getBetLabel(r.betType)} ${r.amount} pts → Perdió\n`;
      }
    }
  }

  // Send result message — edit existing message, fallback to new message
  if (round.messageId) {
    try {
      await bot.api.editMessageText(round.chatId, round.messageId, message);
    } catch (e) {
      logError('editMessageText (result)', e);
      // Fallback: send as new message if edit fails
      try {
        await bot.api.sendMessage(round.chatId, message);
      } catch (e2) {
        logError('sendMessage (result fallback)', e2);
      }
    }
  } else {
    try {
      await bot.api.sendMessage(round.chatId, message);
    } catch (e) {
      logError('sendMessage (result)', e);
    }
  }

  // Cleanup
  if (round.timer) clearTimeout(round.timer);
  activeRounds.delete(groupId);

  // Set cooldown for this group
  roundCooldowns.set(groupId, Date.now() + ROUND_COOLDOWN_MS);
}

// Format current round status for message edits
export function formatRoundStatus(round: ActiveRound): string {
  const betCount = round.bets.size;
  let status = `🎰 RULETA — ¡Apuestas abiertas!\n\n`;
  status += `👥 ${betCount} apuesta(s) registrada(s)\n`;
  status += `⏱️ 30 segundos para apostar\n\n`;
  status += `Toca un tipo de apuesta, luego el monto:`;
  return status;
}
