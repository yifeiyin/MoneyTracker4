import { CheckpointDatabaseSchema, CheckpointSchema } from '../schema';
import TransactionManager from './transactions'; // eslint-disable-line
import AccountManager from './accounts'; // eslint-disable-line
import Monum from '../monum';

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

  async create(checkpoint) {
    checkpoint = CheckpointSchema.omit(['transactionId']).validateSync(checkpoint);

    // Make sure time is unique, multiple checkpoints at a time can be problematic.
    // It is possible to be less strict and only fail when there is an actual conflict.
    // But here we just reject regardless.
    if (await this.table.where('time').equals(checkpoint.time).first() !== undefined)
      throw new Error(`Another checkpoint already exists at ${checkpoint.time.toISOString()}`)

    // Compute the difference to generate the transaction
    const differences = await this.computeBalanceDifferences(checkpoint.time, checkpoint.balances);

    // TODO: Change current implementation. This method should balance the transaction, since
    //       user only records balances for real-world accounts, not for income/expense accounts.
    const [debits, credits] = changesToDebitsCredits(differences);

    const transaction = {
      time: checkpoint.time,
      title: 'Auto balance',
      debits,
      credits,
      tags: [`checkpoint/${checkpoint.time.toISOString()}`],
    }

    await this.db.transaction('rw', this.table, this.transactionManager.table, async () => {
      const transactionId = await this.transactionManager.create(transaction);
      await this.table.add({ ...checkpoint, transactionId });
    });
  }

  async remove(time) {
    // Move the delta to the next checkpoint, if exists.
    // If not, discard it.

    const checkpoint = await this.table.get(time);
    if (!checkpoint)
      throw new Error(`Cannot find checkpoint at ${time.toISOString()}`)

    // eslint-disable-next-line
    const transaction = await this.transactionManager.get(checkpoint.transactionId);

    // eslint-disable-next-line
    for (let { acc, amt } of checkpoint.balances) {
      const nextCheckpoint = await this.findNextCheckpoint(time, this.accountManager.getPath(acc));

      if (nextCheckpoint) {

      }

    }

    await this.table.delete(time);
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
      const diff = amt.sub(existingBalances[acc]);
      if (diff.isNotZero())
        differences.push({ acc, amt: diff });
    }

    return differences;
  }

  async computeAccountBalanceAt(time) {
    const allAccountPaths = this.accountManager.getAllNonFolderAccounts()
      .map(account => account.id)
      .map(accountId => [
        accountId,
        this.accountManager.get(accountId).accountType,
        this.accountManager.getPath(accountId)
      ]);

    const balances = {};

    for (let [accountId, accountType, accountPath] of allAccountPaths) {
      const previousCheckpoint = await this.findPreviousCheckpoint(time, accountPath);
      const transactionsBetween = await this.findTransactionsBetween(previousCheckpoint?.time, time, accountPath);

      let balance = new Monum();
      if (previousCheckpoint) {
        balance = getSumOfAmountsForAccountPath(previousCheckpoint.balances, accountPath);
      }

      const debits = transactionsBetween.map(transaction => transaction.debits).flat();
      const credits = transactionsBetween.map(transaction => transaction.credits).flat();

      const debitSum = getSumOfAmountsForAccountPath(debits, accountPath);
      const creditSum = getSumOfAmountsForAccountPath(credits, accountPath);

      if (accountType === 'debit')
        balance = balance.add(debitSum).sub(creditSum);
      else if (accountType === 'credit')
        balance = balance.add(creditSum).sub(debitSum);
      else
        throw new Error('Unreachable');

      balances[accountId] = balance;
    }

    return balances;

    function getSumOfAmountsForAccountPath(listOfAccAmt, accountPath) {
      return Monum.combine(...listOfAccAmt.filter(({ acc }) => acc === pathToId(accountPath)).map(({ amt }) => amt));
    }

    function pathToId(path) {
      return +path.split('/').reverse()[0];
    }
  }

  async findTransactionsBetween(exclusiveFrom, inclusiveTo, accountPath) {
    if (exclusiveFrom && inclusiveTo)
      return await this.transactionManager.table
        .where('time')
        .between(exclusiveFrom, inclusiveTo, false, true)
        .filter(transaction => transaction._debitsCredits.includes(accountPath))
        .toArray()

    else if (exclusiveFrom)
      return await this.transactionManager.table
        .where('time')
        .above(exclusiveFrom)
        .filter(transaction => transaction._debitsCredits.includes(accountPath))
        .toArray()

    else if (inclusiveTo)
      return await this.transactionManager.table
        .where('time')
        .belowOrEqual(inclusiveTo)
        .filter(transaction => transaction._debitsCredits.includes(accountPath))
        .toArray()

    else
      throw new Error('At least one of exclusiveFrom and inclusiveTo must be defined')
  }

  async findPreviousCheckpoint(time, accountPath) {
    let result = await this.table
      .where('time').below(time)
      .filter(checkpoint => checkpoint._accounts.includes(accountPath))
      .first();
    return result || null;
  }

  async findNextCheckpoint(time, accountPath) {
    let result = await this.table
      .where('time').above(time)
      .filter(checkpoint => checkpoint._accounts.includes(accountPath))
      .first();
    return result || null;
  }

  async get(time) {
    const result = await this.table.get(time);
    if (result === undefined) throw new Error(`Item not found: ${time}`)
    return result;
  }
}

// function debitsCreditsToChanges(debits, credits) {

// }

function changesToDebitsCredits(changes) {
  const debits = [], credits = [];
  for (let { acc, amt } of changes) {
    if (accountIdToType(acc) === 'debit' && amt.isPositive())
      debits.push({ acc, amt })
    else if (accountIdToType(acc) === 'debit' && amt.isNegative())
      credits.push({ acc, amt })
    else if (accountIdToType(acc) === 'credit' && amt.isPositive())
      credits.push({ acc, amt })
    else if (accountIdToType(acc) === 'credit' && amt.isNegative())
      debits.push({ acc, amt })
    else
      throw new Error('Unreachable')
  }

  return [debits, credits]

  function accountIdToType(id) {
    return this.accountManager.get(id).accountType;
  }
}

