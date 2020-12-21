import Monum from './monum';
import { AccountAndAmountListSchema } from './schema'

export function reviver(k, v) {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/.test(v)) {
    return new Date(v);
  } else if (Monum.sniffIsMonum(v)) {
    return Monum.fromJSON(v);
  } else {
    return v;
  }
};

export function deepCopy(obj) { return this.JSON.parse(JSON.stringify(obj), reviver); }

export function debitsMinusCredits(debits, credits) {
  return sumOfAccountAndAmountList(debits).sub(sumOfAccountAndAmountList(credits));
}

export function sumOfAccountAndAmountList(side) {
  side = AccountAndAmountListSchema.validateSync(side);
  return Monum.combine(...side.map(i => i.amt));
}

export function getTodaysDateAt0000() {
  const result = new Date();
  result.setHours(0);
  result.setMinutes(0);
  result.setSeconds(0);
  result.setMilliseconds(0);
  return result;
}
