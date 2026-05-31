import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { initDatabase } from './schema.js';
import * as queries from './queries.js';

describe('Database Queries', () => {
  let db: Database.Database;

  before(() => {
    // Use in-memory database for tests
    db = new Database(':memory:');
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
    `);
  });

  after(() => {
    db.close();
  });

  describe('User operations', () => {
    it('should create a new user with 100 balance', () => {
      const user = queries.createUser(db, '123', 'testuser', 'Test', 'group1');
      assert.ok(user);
      assert.equal(user.balance, 100);
      assert.equal(user.telegram_id, '123');
    });

    it('should get existing user', () => {
      const user = queries.getUser(db, '123', 'group1');
      assert.ok(user);
      assert.equal(user.telegram_id, '123');
    });

    it('should return undefined for non-existent user', () => {
      const user = queries.getUser(db, '999', 'group1');
      assert.equal(user, undefined);
    });

    it('should update balance', () => {
      queries.updateBalance(db, '123', 'group1', 50);
      const balance = queries.getBalance(db, '123', 'group1');
      assert.equal(balance, 150);
    });

    it('should get top players', () => {
      queries.createUser(db, '456', 'user2', 'User2', 'group1');
      queries.updateBalance(db, '456', 'group1', 200);
      
      const top = queries.getTopPlayers(db, 'group1', 10);
      assert.ok(top.length >= 2);
      assert.ok(top[0].balance >= top[1].balance);
    });
  });

  describe('Round operations', () => {
    it('should create a round', () => {
      const round = queries.createRound(db, 'group1', 7, '123');
      assert.ok(round);
      assert.equal(round.result_number, 7);
    });

    it('should create a bet', () => {
      const round = queries.createRound(db, 'group1', 7, '123');
      const user = queries.getUser(db, '123', 'group1');
      assert.ok(user);
      
      const bet = queries.createBet(db, round.id, user.id, 'rojo', 50);
      assert.ok(bet);
      assert.equal(bet.amount, 50);
    });
  });
});
