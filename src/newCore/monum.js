import { MonumCurrencySchema, MonumValueSchema, MonumSchema, AccountIdSchema, TransactionIdSchema } from './schema';

const ITEM_SEPARATOR = '+';
const SPACE = ' ';
const BOUNDARY = '|'; // NOTES: Hard coded in some regex

export default class Monum {
  static fromJSON(input) {
    const inside = input.match(/^\|(.+)\|$/);
    if (inside === null) throw new Error(`Invalid monum: expected to be surrounded with ${BOUNDARY}`);
    const currencyAndValues = inside.split(ITEM_SEPARATOR);
    let result = new Monum();
    for (let [cur, val] of currencyAndValues) {
      result = result.add(new Monum(cur, val));
    }
    return result;
  }

  static sniffIsMonum(input) {
    try {
      Monum.fromJSON(input);
    } catch (error) {
      return false;
    }
    return true;
  }

  constructor(currency, value) {

    if (currency === undefined && value === undefined)
      return this;

    currency = MonumCurrencySchema.validateSync(currency);
    value = MonumValueSchema.validateSync(value);

    // TODO: Check acceptable currencies

    this[currency] = value;
  }

  toString() {
    return Object.entries(this).map(([k, v]) => k + SPACE + v).join(ITEM_SEPARATOR);
  }

  isZero() {
    for (let key in this)
      if (Number(this[key]) !== 0.0)
        return false;
    return true;
  }

  isNotZero() { return !this.isZero(); }

  toJSON() {
    return this;
  }

}
