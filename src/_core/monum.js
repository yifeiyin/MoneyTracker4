import { MonumCurrencySchema, MonumValueSchema, MonumSchema } from './schema';


const ITEM_SEPARATOR = '+';
const SPACE = ' ';
const BOUNDARY = '|'; // NOTES: Hard coded in some regex
const PRECISION = 5;

const CONVERSION_RATE_X_TO_USD = {
  'CNY': 0.15,
  'CAD': 0.79,
  'USD': 1.0,
}

export default class Monum {
  static fromJSON(input) {
    const match = input.match(/^\|(.*)\|$/);
    if (match === null) throw new Error(`Invalid monum: expected to be surrounded with ${BOUNDARY}`);
    const inside = match[1];
    if (inside.length === 0) return new Monum();
    const currencyAndValues = inside.split(ITEM_SEPARATOR).map(item => item.split(SPACE));
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

  static combine(...args) { return new Monum().add(...args); }

  constructor(currency, value) {
    if (currency === undefined && value === undefined)
      return this;

    currency = MonumCurrencySchema.validateSync(currency);
    value = MonumValueSchema.validateSync(value);

    // TODO: Check acceptable currencies

    this[currency] = value;
  }

  toString() { return BOUNDARY + Object.entries(this).map(([k, v]) => k + SPACE + v).join(ITEM_SEPARATOR) + BOUNDARY; }
  toJSON() { return this.toString(); }
  copy() { return Object.assign(new Monum(), this); }
  toReadable() { return Object.entries(this).map(([k, v]) => k + ' ' + v).join('+') || '0'; }

  _add(other) {
    other = MonumSchema.validateSync(other);
    if (!(other instanceof Monum)) throw new Error('Not of instance Monum?!');

    let result = this.copy();
    for (let key in other) {
      result[key] = result[key] === undefined ? other[key] : addTwoStringNumber(result[key], other[key]);
      if (Number(result[key]) === 0.0) delete result[key];
    }
    return result;
  }

  add(...others) {
    let result = this.copy();
    for (let other of others) result = result._add(other);
    return result;
  }

  neg() {
    let result = this.copy();
    for (let key in result) result[key] = negateStringNumber(result[key]);
    return result;
  }

  sub(...others) { return new Monum().add(...others).neg().add(this); }

  isZero() {
    for (let key in this)
      if (Number(this[key]) !== 0.0)
        return false;
    return true;
  }

  isNotZero() { return !this.isZero(); }

  isPositive() {
    if (this.isZero()) return false;
    if (Object.keys(this).length === 1) return Object.values(this)[0] > 0;

    let total = 0.0;
    for (let [key, value] of Object.entries(this)) {
      const conversionRate = CONVERSION_RATE_X_TO_USD[key];
      if (conversionRate === undefined) throw new Error('Encountered unknown currency when estimating sign');
      total += conversionRate * value;
    }
    return total > 0;
  }

  castToNumberInCurrency(currency) {
    let total = 0.0;

    for (let [key, value] of Object.entries(this)) {
      const conversionRate = CONVERSION_RATE_X_TO_USD[key];
      if (conversionRate === undefined) throw new Error('Encountered unknown currency when estimating sign');
      total += conversionRate * value;
    }

    const conversionRate = CONVERSION_RATE_X_TO_USD[currency];
    if (conversionRate === undefined) throw new Error('Encountered unknown currency when estimating sign');
    return total / conversionRate;
  }

  isNegative() {
    if (this.isZero()) return false;
    return !this.isPositive();
  }
}

function negateStringNumber(a) {
  return (-Number(a)).toFixed(PRECISION).replace(/\.?0+$/, '');
}

function addTwoStringNumber(a, b) {
  return (Number(a) + Number(b)).toFixed(PRECISION).replace(/\.?0+$/, '');
}
