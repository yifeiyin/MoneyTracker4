import Monum from '../monum';
import { AccountAndAmountListSchema } from '../schema'

export { default as BalanceAccumulator } from './balance-accumulator'

export function reviver(k, v) {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/.test(v)) {
    return new Date(v);
  } else if (Monum.sniffIsMonum(v)) {
    return Monum.fromJSON(v);
  } else {
    return v;
  }
};

export function parse(str) { return JSON.parse(str, reviver); }
export function deepCopy(obj) { return parse(JSON.stringify(obj)); }

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

export function formatDate(date, withTimezone = true) {
  if (!date) return 'Invalid Date';

  return (
    date.getFullYear() + '-' +
    TwoDigitPad(date.getMonth() + 1) + '-' +
    TwoDigitPad(date.getDate()) + ' ' +
    (
      date.getHours() === 0 && date.getMinutes() === 0 ? '' :
        TwoDigitPad(date.getHours()) + ':' +
        TwoDigitPad(date.getMinutes())) +
    (
      date.getSeconds() === 0 ? '' :
        (':' + TwoDigitPad(date.getSeconds()))
    ) +
    (
      !withTimezone ? '' :
        date.toString().substr(date.toString().indexOf('GMT'))
    )
  )

  function TwoDigitPad(s) {
    return s < 10 ? '0' + s : s;
  }
}

export function getNowDateTimeString() {
  return formatDate(new Date(), false).replace(' ', '-').replace(/:/g, '');
}

export function toTitleCase(str) {
  return str.replace(
    /(\w*\W*|\w*)\s*/g,
    function (txt) {
      return (txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
    }
  );
}

export function assert(condition, message) {
  if (!condition) throw new Error(message || "Assertion failed")
}

export function getAccountColor(accountOrId) {
  if (!accountOrId) return 'black'

  let id;
  if (accountOrId.id) {
    id = accountOrId.id
  } else {
    id = accountOrId
  }

  const hue = (id * 3 % 40) * 9
  // const hue = (id * 7 % 60) * 6
  if (isNaN(hue)) return 'black'
  return `hsla(${hue}, 80%, 40%, 0.7)`
}

export function ColorStripSpan({ id, account }) {
  return <><span style={{ backgroundColor: getAccountColor(id ?? account) }}>&nbsp;&nbsp;</span>&nbsp;</>
}
