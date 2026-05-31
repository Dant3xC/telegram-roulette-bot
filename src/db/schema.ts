import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'ruleta.db');

export function initDatabase(): Database.Database {
  const db = new Database(DB_PATH);

  // Enable WAL mode for better concurrent performance
  db.pragma('journal_mode = WAL');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id TEXT NOT NULL,
      username TEXT,
      first_name TEXT NOT NULL,
      balance INTEGER NOT NULL DEFAULT 0,
      group_id TEXT NOT NULL,
      last_daily TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(telegram_id, group_id)
    );

    CREATE TABLE IF NOT EXISTS rounds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id TEXT NOT NULL,
      result_number INTEGER NOT NULL,
      started_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      round_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      bet_type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (round_id) REFERENCES rounds(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_users_telegram_group ON users(telegram_id, group_id);
    CREATE INDEX IF NOT EXISTS idx_users_group_balance ON users(group_id, balance DESC);
    CREATE INDEX IF NOT EXISTS idx_rounds_group ON rounds(group_id);
    CREATE INDEX IF NOT EXISTS idx_bets_round ON bets(round_id);
  `);

  return db;
}
