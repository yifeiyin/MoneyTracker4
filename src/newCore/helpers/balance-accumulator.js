import Monum from '../monum';

export default class BalanceAccumulator {
  static CREDIT = 'credit'
  static DEBIT = 'debit'

  constructor(transactions) {
    this.internal = [];
    if (transactions instanceof Array)
      this.addTransactions(transactions);
    else if (transactions !== undefined)
      this.addTransactions([transactions])
  }

  addTransactions(transactions) {
    for (let transaction of transactions) {
      const { debits, credits } = transaction;
      for (let { acc, amt } of debits)
        this.addAmount(acc, this.constructor.DEBIT, amt);
      for (let { acc, amt } of credits)
        this.addAmount(acc, this.constructor.CREDIT, amt);
    }
  }

  addAmount(accountId, type, amount) {
    const newAmount = Monum.combine(amount, this.getAmount(accountId, type));
    this.setAmount(accountId, type, newAmount);
  }

  setAmount(accountId, type, amount) {
    const results = this.internal.filter(entry => entry.accountId === accountId && entry.type === type);
    assert(results.length <= 1);
    if (results.length === 0)
      this.internal.push({ accountId, type, amount })
    else
      Object.assign(results[0], { amount })
  }

  getAmount(accountId, type) {
    const results = this.internal.filter(entry => entry.accountId === accountId && entry.type === type);
    assert(results.length <= 1);
    if (results.length === 0)
      return new Monum();
    else
      return results[0].amount;
  }

  getAccountDebits(accountId) {
    return this.getAmount(accountId, this.constructor.DEBIT)
  }

  getAccountCredits(accountId) {
    return this.getAmount(accountId, this.constructor.CREDIT)
  }

  getAccountBalance(accountId) {
    const drMinusCr = this.getAccountDebits(accountId).sub(this.getAccountCredits(accountId));
    if (drMinusCr.isNegative())
      return { type: this.constructor.CREDIT, balance: drMinusCr.neg() }
    return { type: this.constructor.DEBIT, balance: drMinusCr }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || "Assertion failed")
}
