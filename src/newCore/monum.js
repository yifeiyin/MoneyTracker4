import { MonumCurrencySchema, MonumValueSchema, MonumSchema, AccountIdSchema, TransactionIdSchema } from './schema';

const ITEM_SEPARATOR = '˖';
const SPACE = ' ';
const BOUNDARY = '|';

class Monum {
  constructor(currency, value) {

    if (currency === undefined && value === undefined)
      return this;

    currency = MonumCurrencySchema.validateSync(currency);
    value = MonumValueSchema.validateSync(value);

    // TODO: Check acceptable currencies

    this[currency] = value;
  }

  toString() {
    return Object.entries(this).map(([k, v]) => `${k} ${v}`).join(ITEM_SEPARATOR);
  }

  isZero() {
    for (let key in this)
      if (!key.startsWith('_') && Number(this[key]) !== 0.0)
        return false;
    return true;
  }

  isNotZero() { return !this.isZero(); }

  toJSON() {
    return this;
  }
}
