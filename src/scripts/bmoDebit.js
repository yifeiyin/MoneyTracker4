import Monum from '../newCore/monum';
import bmoDebitCodeToReadableType from './bmoDebitCodeToReadable';

import { assert } from '../newCore/helpers'

const $CR = 'credit';
const $DR = 'debit';

const AC_CHEQUING = 'BMO Chequing';
const AC_MASTER_CARD = 'BMO MasterCard';
const AC_SAVING = 'BMO Saving';
const AC_OTHER_EXPENSE = 'Other Income/Expense';
const AC_UNKNOWN_EXPENSE = 'Unknown Income/Expense';


export default async function csvToTransactions(input) {
  const transformed = transformStatement(input).map(generateTransaction).map(postProcess);
  return await Promise.all(transformed);
}


function transformStatement(originalStatement) {
  const lines = originalStatement.split('\n');

  let result = [];
  for (let line of lines.splice(12)) {
    if (line.trim() === '') continue;

    const [accountNo, crDr, date, amount0, desc] = line.split(',');
    if (!accountNo.includes('0031717')) throw new Error('Card number is different');

    const type = crDr === 'DEBIT' ? $CR : $DR;  // Reversed
    const $time = new Date(date.substr(0, 4), date.substr(4, 2), date.substr(6, 2));
    const amount = amount0.replace(/-/, '');
    const rawDesc = desc;

    result.push({
      type, $time, amount, rawDesc,
    });
  }

  return result;
}


function generateTransaction(inputs) {
  const { type, $time, amount, rawDesc } = inputs;

  const result = { $time, amount, type };
  let $title = 'Untitled', thisSide, otherSide;
  thisSide = AC_CHEQUING;

  let code = rawDesc.substr(1, 2);
  result._bmoTransType = bmoDebitCodeToReadableType[code] + ' (' + code + ')';
  const desc = rawDesc.substr(4);

  switch (code) {
    case 'CW':
      if (desc.includes('INTERAC ETRNSFR')) {
        const emtParty = desc.substr(25, 25).trim();
        result._emtOtherParty = emtParty;
        result._emtRefNumber = desc.substr(50, 17);
        if (desc.includes('SENT')) {
          $title = 'eTransfer to ' + emtParty;
          assert(type === $CR);

        } else {
          $title = 'eTransfer from ' + emtParty;
          assert(type === $DR);
        }

      } else if (rawDesc.includes(' TF ')) {
        let toFrom = desc.substr(4).trim();
        if (toFrom.includes('3373')) {
          toFrom = 'credit card';
          otherSide = AC_MASTER_CARD;
        } else if (toFrom.includes('2986#8831')) {
          toFrom = 'saving';
          otherSide = AC_SAVING;
        }
        $title = 'Bank Transfer ' + (type === $DR ? 'from' : 'to') + ' ' + toFrom;
      }

      break;

    case 'PR':
      $title = 'Purchase at ' + desc;
      break;

    case 'SC':
      otherSide = AC_OTHER_EXPENSE;

      if (desc.includes('PREMIUM PLAN')) {
        $title = 'Premium Plan Banking Fee';

      } else if (desc.includes('FULL PLAN FEE REBATE')) {
        $title = 'Premium Plan Banking Fee Refund';
      }

      break;

    default:
  }

  Object.assign(result, { thisSide, otherSide, $title });

  return result;
}

async function postProcess(inputs) {
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
      assert(['amount', 'time', 'debits', 'credits', 'title'].includes(newKey));
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
