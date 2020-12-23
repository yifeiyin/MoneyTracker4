import Monum from '../newCore/monum';
import { assert } from '../newCore/helpers'

export const $CR = 'credit';
export const $DR = 'debit';

export const AC_CHEQUING = 'BMO Chequing';
export const AC_SAVING = 'BMO Saving';
export const AC_MASTER_CARD = 'BMO MasterCard';

export const AC_GROCERY_EXPENSE = 'Grocery Expense';
export const AC_TRANSPORTATION_EXPENSE = 'Transportation Expense';
export const AC_SOCIAL_EXPENSE = 'Social Expense';
export const AC_HOBBY_EXPENSE = 'Hobby Expense';
export const AC_DINING_EXPENSE = 'Dining Expense';
export const AC_SUBSCRIPTION_EXPENSE = 'Subscription Expense';
export const AC_UNKNOWN_EXPENSE = 'Unknown Income/Expense';
export const AC_OTHER_EXPENSE = 'Other Income/Expense';

export const AC_ALL_EXPENSE = [
  AC_UNKNOWN_EXPENSE,
  AC_TRANSPORTATION_EXPENSE,
  AC_GROCERY_EXPENSE,
  AC_SOCIAL_EXPENSE,
  AC_HOBBY_EXPENSE,
  AC_DINING_EXPENSE,
  AC_SUBSCRIPTION_EXPENSE,
  AC_OTHER_EXPENSE,
];

export async function postProcess(inputs) {
  const raw = inputs;

  let { type, thisSide, otherSide, amount } = raw;
  otherSide = otherSide || AC_UNKNOWN_EXPENSE;

  const thisSideAcc = await global.accountManager.fromNameToId(thisSide);
  const otherSideAcc = await global.accountManager.fromNameToId(otherSide);
  assert(thisSideAcc !== undefined, thisSide + ' not found');
  assert(otherSideAcc !== undefined, otherSide + ' not found');
  const thisSideCrDr = { acc: thisSideAcc, amt: new Monum('CAD', amount) };
  const otherSideCrDr = { acc: otherSideAcc, amt: new Monum('CAD', amount) };
  if (type === $CR) {
    raw.$credits = thisSideCrDr;
    raw.$debits = otherSideCrDr;

  } else if (type === $DR) {
    raw.$debits = thisSideCrDr;
    raw.$credits = otherSideCrDr;

  } else {
    throw new Error('Unexpected value for type: ' + type);
  }

  // Remove properties that starts with $
  for (let key in raw) {
    if (key.startsWith('$')) {
      // Must be a valid mandatory field
      const newKey = key.substr(1);
      assert(['amount', 'time', 'debits', 'credits', 'title', 'tags'].includes(newKey));
      raw[newKey] = raw[key];
      delete raw[key];

    } else if (key.startsWith('_')) {
      // Keep them as custom fields
      const newKey = key.substr(1);
      raw[newKey] = raw[key];
      delete raw[key];

    } else {
      // If the field does not starts with $ or _, remove it
      delete raw[key];
    }
  }

  return raw;
}
