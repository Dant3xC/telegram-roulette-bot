// Round states
export type RoundState = 'IDLE' | 'BETTING' | 'SPINNING' | 'RESULT';

// Bet types (the 10 options)
export type BetType =
  | 'rojo'
  | 'negro'
  | 'verde'
  | 'par'
  | 'impar'
  | '1-18'
  | '19-36'
  | '1-12'
  | '13-24'
  | '25-36';

// User in database
export interface User {
  id: number;
  telegram_id: string;
  username: string | null;
  first_name: string;
  balance: number;
  group_id: string;
  last_daily: string | null;
  created_at: string;
}

// Bet placed in a round
export interface Bet {
  id: number;
  round_id: number;
  user_id: number;
  bet_type: BetType;
  amount: number;
  created_at: string;
}

// Completed round
export interface Round {
  id: number;
  group_id: string;
  result_number: number;
  started_by: string;
  created_at: string;
}

// Active round in memory (not persisted)
export interface ActiveRound {
  state: RoundState;
  groupId: string;
  startedBy: string;
  bets: Map<string, { userId: string; betType: BetType; amount: number }>; // key: telegram_id
  timer: NodeJS.Timeout | null;
  messageId: number | null;
  chatId: number;
}

// Bet payout info
export interface BetPayout {
  betType: BetType;
  payoutMultiplier: number;
}
