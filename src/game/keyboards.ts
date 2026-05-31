import { InlineKeyboard } from 'grammy';
import { BetType } from '../types.js';

// Bet type to display label
const BET_LABELS: Record<BetType, string> = {
  'rojo': '🔴 Rojo',
  'negro': '⚫ Negro',
  'verde': '🟢 Verde',
  'par': '🔄 Par',
  'impar': '🔄 Impar',
  '1-18': '📊 1-18',
  '19-36': '📊 19-36',
  '1-12': '📦 1-12',
  '13-24': '📦 13-24',
  '25-36': '📦 25-36',
};

// Amount options for quick bet
const AMOUNTS = [10, 25, 50, 100];

// Create the betting keyboard for a round
export function createBetKeyboard(): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  // Bet type buttons (2 per row)
  const betTypes = Object.keys(BET_LABELS) as BetType[];
  for (let i = 0; i < betTypes.length; i += 2) {
    // First button in the row
    keyboard.text(BET_LABELS[betTypes[i]], `bet:${betTypes[i]}`);
    // Second button in the row (if exists)
    if (i + 1 < betTypes.length) {
      keyboard.text(BET_LABELS[betTypes[i + 1]], `bet:${betTypes[i + 1]}`);
    }
    // Line break after each pair
    keyboard.row();
  }

  // Amount selector row
  for (const amount of AMOUNTS) {
    keyboard.text(`${amount} pts`, `amount:${amount}`);
  }

  return keyboard;
}

// Get label for a bet type
export function getBetLabel(betType: BetType): string {
  return BET_LABELS[betType];
}
