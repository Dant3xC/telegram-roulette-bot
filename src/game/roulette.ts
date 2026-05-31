import crypto from 'crypto';
import { BetType, BetPayout } from '../types.js';

// Red numbers in European roulette
const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
// Black numbers
const BLACK_NUMBERS = new Set([2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35]);

// All valid bets and their payouts
export const BET_PAYOUTS: Record<BetType, number> = {
  'rojo': 2,
  'negro': 2,
  'verde': 14,
  'par': 2,
  'impar': 2,
  '1-18': 2,
  '19-36': 2,
  '1-12': 3,
  '13-24': 3,
  '25-36': 3,
};

// Spin the wheel — returns 0-36
export function spin(): number {
  return crypto.randomInt(0, 37);
}

// Get color of a number
export function getColor(num: number): 'red' | 'black' | 'green' {
  if (num === 0) return 'green';
  if (RED_NUMBERS.has(num)) return 'red';
  return 'black';
}

// Check if a bet wins for a given result number
export function isWinningBet(betType: BetType, resultNumber: number): boolean {
  if (resultNumber === 0) {
    return betType === 'verde';
  }

  switch (betType) {
    case 'rojo': return RED_NUMBERS.has(resultNumber);
    case 'negro': return BLACK_NUMBERS.has(resultNumber);
    case 'verde': return resultNumber === 0;
    case 'par': return resultNumber % 2 === 0;
    case 'impar': return resultNumber % 2 !== 0;
    case '1-18': return resultNumber >= 1 && resultNumber <= 18;
    case '19-36': return resultNumber >= 19 && resultNumber <= 36;
    case '1-12': return resultNumber >= 1 && resultNumber <= 12;
    case '13-24': return resultNumber >= 13 && resultNumber <= 24;
    case '25-36': return resultNumber >= 25 && resultNumber <= 36;
    default: return false;
  }
}

// Calculate payout for a single bet
export function calculatePayout(betType: BetType, amount: number, resultNumber: number): number {
  if (isWinningBet(betType, resultNumber)) {
    return amount * BET_PAYOUTS[betType];
  }
  return 0;
}

// Format result number with color emoji
export function formatResult(num: number): string {
  const color = getColor(num);
  const emoji = color === 'red' ? '🔴' : color === 'black' ? '⚫' : '🟢';
  return `${emoji} ${num}`;
}
