import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spin, getColor, isWinningBet, calculatePayout, BET_PAYOUTS } from './roulette.js';

describe('Roulette', () => {
  describe('spin()', () => {
    it('should return a number between 0 and 36', () => {
      for (let i = 0; i < 1000; i++) {
        const result = spin();
        assert.ok(result >= 0 && result <= 36, `Expected 0-36, got ${result}`);
      }
    });
  });

  describe('getColor()', () => {
    it('should return green for 0', () => {
      assert.equal(getColor(0), 'green');
    });

    it('should return red for red numbers', () => {
      const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
      for (const num of redNumbers) {
        assert.equal(getColor(num), 'red', `Expected ${num} to be red`);
      }
    });

    it('should return black for black numbers', () => {
      const blackNumbers = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];
      for (const num of blackNumbers) {
        assert.equal(getColor(num), 'black', `Expected ${num} to be black`);
      }
    });
  });

  describe('isWinningBet()', () => {
    it('should win verde only on 0', () => {
      assert.ok(isWinningBet('verde', 0));
      assert.ok(!isWinningBet('verde', 1));
      assert.ok(!isWinningBet('verde', 36));
    });

    it('should win rojo on red numbers', () => {
      assert.ok(isWinningBet('rojo', 1));
      assert.ok(isWinningBet('rojo', 36));
      assert.ok(!isWinningBet('rojo', 2));
      assert.ok(!isWinningBet('rojo', 0));
    });

    it('should win negro on black numbers', () => {
      assert.ok(isWinningBet('negro', 2));
      assert.ok(isWinningBet('negro', 35));
      assert.ok(!isWinningBet('negro', 1));
      assert.ok(!isWinningBet('negro', 0));
    });

    it('should win par on even numbers (not 0)', () => {
      assert.ok(isWinningBet('par', 2));
      assert.ok(isWinningBet('par', 36));
      assert.ok(!isWinningBet('par', 1));
      assert.ok(!isWinningBet('par', 0));
    });

    it('should win impar on odd numbers', () => {
      assert.ok(isWinningBet('impar', 1));
      assert.ok(isWinningBet('impar', 35));
      assert.ok(!isWinningBet('impar', 2));
      assert.ok(!isWinningBet('impar', 0));
    });

    it('should win 1-18 on numbers 1-18', () => {
      assert.ok(isWinningBet('1-18', 1));
      assert.ok(isWinningBet('1-18', 18));
      assert.ok(!isWinningBet('1-18', 19));
      assert.ok(!isWinningBet('1-18', 0));
    });

    it('should win 19-36 on numbers 19-36', () => {
      assert.ok(isWinningBet('19-36', 19));
      assert.ok(isWinningBet('19-36', 36));
      assert.ok(!isWinningBet('19-36', 18));
      assert.ok(!isWinningBet('19-36', 0));
    });

    it('should win 1-12 on numbers 1-12', () => {
      assert.ok(isWinningBet('1-12', 1));
      assert.ok(isWinningBet('1-12', 12));
      assert.ok(!isWinningBet('1-12', 13));
    });

    it('should win 13-24 on numbers 13-24', () => {
      assert.ok(isWinningBet('13-24', 13));
      assert.ok(isWinningBet('13-24', 24));
      assert.ok(!isWinningBet('13-24', 12));
    });

    it('should win 25-36 on numbers 25-36', () => {
      assert.ok(isWinningBet('25-36', 25));
      assert.ok(isWinningBet('25-36', 36));
      assert.ok(!isWinningBet('25-36', 24));
    });
  });

  describe('calculatePayout()', () => {
    it('should pay x2 for rojo on red number', () => {
      assert.equal(calculatePayout('rojo', 100, 1), 200);
      assert.equal(calculatePayout('rojo', 100, 2), 0);
    });

    it('should pay x14 for verde on 0', () => {
      assert.equal(calculatePayout('verde', 100, 0), 1400);
      assert.equal(calculatePayout('verde', 100, 1), 0);
    });

    it('should pay x3 for dozens', () => {
      assert.equal(calculatePayout('1-12', 100, 5), 300);
      assert.equal(calculatePayout('13-24', 100, 15), 300);
      assert.equal(calculatePayout('25-36', 100, 30), 300);
    });
  });

  describe('BET_PAYOUTS', () => {
    it('should have correct payout multipliers', () => {
      assert.equal(BET_PAYOUTS['rojo'], 2);
      assert.equal(BET_PAYOUTS['negro'], 2);
      assert.equal(BET_PAYOUTS['verde'], 14);
      assert.equal(BET_PAYOUTS['par'], 2);
      assert.equal(BET_PAYOUTS['impar'], 2);
      assert.equal(BET_PAYOUTS['1-18'], 2);
      assert.equal(BET_PAYOUTS['19-36'], 2);
      assert.equal(BET_PAYOUTS['1-12'], 3);
      assert.equal(BET_PAYOUTS['13-24'], 3);
      assert.equal(BET_PAYOUTS['25-36'], 3);
    });

    it('should have 10 bet types', () => {
      assert.equal(Object.keys(BET_PAYOUTS).length, 10);
    });
  });
});
