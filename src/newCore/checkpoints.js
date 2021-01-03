import { CheckpointDatabaseSchema } from "./schema";
import TransactionManager from "./transactions"; // eslint-disable-line
import AccountManager from "./accounts"; // eslint-disable-line
import Monum from './monum';

export default class CheckpointManager {
  static getInitialSetupData() {
  }

  /** @type {TransactionManager} */
  transactionManager = null;

  /** @type {AccountManager} */
  accountManager = null;

  /**
   * @param {import("dexie").Table} table
   * @param {import("dexie").Dexie} db
   */
  constructor(table, db) {
    this.table = table;
    this.db = db;
  }

  async exportData() {
    return await this.table.toArray();
  }

  async importData(data) {
    data = CheckpointDatabaseSchema.validateSync(data);
    return await this.db.transaction('rw', this.table, async () => {
      await this.table.clear();
      await this.table.bulkAdd(data);
    });
  }

  async create(data) {
    data = CheckpointDatabaseSchema.validateSync(data);

    // Make sure time is unique, multiple checkpoints at a time can be problematic.
    // It is possible to be less strict and only fail when there is an actual conflict.
    // But here we just reject regardless.
    if (await this.table.where('time').equals(data.time).first() !== null)
      throw new Error(`Another checkpoint already exists at ${data.time}`)

    const differences = await this.computeBalanceDifferences(data.time, data.balances);
    const debits = [], credits = [];
    for (let { acc, amt } of differences) {
      if (this.accountIdToType(acc) === 'debit' && amt.isPositive())
        debits.push({ acc, amt })
      else if (this.accountIdToType(acc) === 'debit' && amt.isNegative())
        credits.push({ acc, amt })
      else if (this.accountIdToType(acc) === 'credit' && amt.isPositive())
        credits.push({ acc, amt })
      else if (this.accountIdToType(acc) === 'credit' && amt.isNegative())
        debits.push({ acc, amt })
      else
        throw new Error('Unreachable')
    }

    const transaction = {
      time: data.time,
      title: 'Auto balance',
      debits,
      credits,
      tags: ['checkpoint/x'],
    }
    // await this.table.add(data);

    // Create linked transaction
    // Need to compute the current balance, then find the difference
    // The difference is what gets added to the transaction
  }

  async remove(time) {
    await this.table.delete(time);
    // Move the delta to the next checkpoint, if exists.
    // If not, discard it.
  }

  async update(time, changes) {
    if ('time' in changes) {
      // Treat as delete then create
    }

    if ('balances' in changes) {
      // Recompute linked transaction
    }

    await this.table.update(time, changes);
  }

  async computeBalanceDifferences(time, newBalances) {
    const existingBalances = await this.computeAccountBalanceAt(time);

    const differences = [];
    for (let { acc, amt } of newBalances) {
      const diff = amt.sub(existingBalances[acc] || new Monum());
      if (diff.isNotZero())
        differences.push(diff);
    }

    return differences;
  }

  async computeAccountBalanceAt(time) {
    const previousCheckpoint = await this.getPreviousCheckpoint(time);
    const transactionsBetween = await this.findTransactionsBetween(previousCheckpoint?.time, time);
    const runningBalances = previousCheckpoint?.balances || {};

    transactionsBetween.forEach(({ debits, credits }) => {
      for (let { acc, amt } of debits)
        if (this.accountIdToType(acc) === 'debit')
          runningBalances[acc] = (runningBalances[acc] || new Monum()).add(amt)
        else
          runningBalances[acc] = (runningBalances[acc] || new Monum()).add(amt.neg())

      for (let { acc, amt } of credits)
        if (this.accountIdToType(acc) === 'credit')
          runningBalances[acc] = (runningBalances[acc] || new Monum()).add(amt)
        else
          runningBalances[acc] = (runningBalances[acc] || new Monum()).add(amt.neg())
    })

    return runningBalances;
  }

  accountIdToType(id) {
    return this.accountManager.get(id).accountType;
  }

  async findTransactionsBetween(exclusiveFrom, inclusiveTo) {
    if (exclusiveFrom)
      return await this.transactionManager.table
        .where('time')
        .between(exclusiveFrom, inclusiveTo, false, true)
        .toArray()
    else
      return await this.transactionManager.table
        .where('time')
        .belowOrEqual(inclusiveTo)
        .toArray()
  }

  async getPreviousCheckpoint(time) {
    let result = await this.table.where('time').below(time).first();
    return result || null;
  }

  async get(time) {
    const result = await this.table.get(time);
    if (result === undefined) throw new Error('Item not found')
    return result;
  }
}
