import Database from 'better-sqlite3';
import type { User, Round, Bet, BetType } from '../types.js';

// ─── User queries ───────────────────────────────────────────

export function getUser(
  db: Database.Database,
  telegramId: string,
  groupId: string
): User | undefined {
  return db
    .prepare('SELECT * FROM users WHERE telegram_id = ? AND group_id = ?')
    .get(telegramId, groupId) as User | undefined;
}

export function createUser(
  db: Database.Database,
  telegramId: string,
  username: string | null,
  firstName: string,
  groupId: string
): User {
  db.prepare(
    'INSERT INTO users (telegram_id, username, first_name, balance, group_id) VALUES (?, ?, ?, 100, ?)'
  ).run(telegramId, username, firstName, groupId);

  return getUser(db, telegramId, groupId)!;
}

export function updateBalance(
  db: Database.Database,
  telegramId: string,
  groupId: string,
  amount: number
): { success: boolean; newBalance: number | null } {
  const current = getBalance(db, telegramId, groupId);
  if (current === null) return { success: false, newBalance: null };

  const newBalance = current + amount;
  if (newBalance < 0) {
    // Clamp to zero instead of allowing negative
    db.prepare(
      'UPDATE users SET balance = 0 WHERE telegram_id = ? AND group_id = ?'
    ).run(telegramId, groupId);
    return { success: true, newBalance: 0 };
  }

  db.prepare(
    'UPDATE users SET balance = balance + ? WHERE telegram_id = ? AND group_id = ?'
  ).run(amount, telegramId, groupId);
  return { success: true, newBalance };
}

export function getBalance(
  db: Database.Database,
  telegramId: string,
  groupId: string
): number | null {
  const row = db
    .prepare('SELECT balance FROM users WHERE telegram_id = ? AND group_id = ?')
    .get(telegramId, groupId) as { balance: number } | undefined;
  return row?.balance ?? null;
}

export function getTopPlayers(
  db: Database.Database,
  groupId: string,
  limit: number = 10
): User[] {
  return db
    .prepare('SELECT * FROM users WHERE group_id = ? ORDER BY balance DESC LIMIT ?')
    .all(groupId, limit) as User[];
}

export function getLastDaily(
  db: Database.Database,
  telegramId: string,
  groupId: string
): string | null {
  const row = db
    .prepare('SELECT last_daily FROM users WHERE telegram_id = ? AND group_id = ?')
    .get(telegramId, groupId) as { last_daily: string | null } | undefined;
  return row?.last_daily ?? null;
}

export function updateLastDaily(
  db: Database.Database,
  telegramId: string,
  groupId: string
): void {
  db.prepare(
    "UPDATE users SET last_daily = datetime('now') WHERE telegram_id = ? AND group_id = ?"
  ).run(telegramId, groupId);
}

// ─── Round queries ──────────────────────────────────────────

export function createRound(
  db: Database.Database,
  groupId: string,
  resultNumber: number,
  startedBy: string
): Round {
  const info = db
    .prepare(
      'INSERT INTO rounds (group_id, result_number, started_by) VALUES (?, ?, ?)'
    )
    .run(groupId, resultNumber, startedBy);

  return db
    .prepare('SELECT * FROM rounds WHERE id = ?')
    .get(info.lastInsertRowid) as Round;
}

// ─── Bet queries ────────────────────────────────────────────

export function createBet(
  db: Database.Database,
  roundId: number,
  userId: number,
  betType: BetType,
  amount: number
): Bet {
  const info = db
    .prepare(
      'INSERT INTO bets (round_id, user_id, bet_type, amount) VALUES (?, ?, ?, ?)'
    )
    .run(roundId, userId, betType, amount);

  return db
    .prepare('SELECT * FROM bets WHERE id = ?')
    .get(info.lastInsertRowid) as Bet;
}

export function getBetsByRound(
  db: Database.Database,
  roundId: number
): Bet[] {
  return db
    .prepare('SELECT * FROM bets WHERE round_id = ?')
    .all(roundId) as Bet[];
}

export function getRoundsPlayed(
  db: Database.Database,
  userId: number
): number {
  const row = db
    .prepare(
      'SELECT COUNT(DISTINCT round_id) as count FROM bets WHERE user_id = ?'
    )
    .get(userId) as { count: number } | undefined;
  return row?.count ?? 0;
}
