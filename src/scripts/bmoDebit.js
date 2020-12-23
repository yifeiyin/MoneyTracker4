import bmoDebitCodeToReadableType from './bmoDebitCodeToReadable';
import { assert, getNowDateTimeString, toTitleCase } from '../newCore/helpers'

import {
  postProcess,
  $CR,
  $DR,
  AC_CHEQUING,
  AC_MASTER_CARD,
  AC_SAVING,
  AC_OTHER_EXPENSE,
} from './helper'

export default async function csvToTransactions(input) {
  const tag = 'import/debit@' + getNowDateTimeString();
  const transformed = transformStatement(input, tag).map(generateTransaction).map(postProcess);
  return await Promise.all(transformed);
}


function transformStatement(originalStatement, tag) {
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
      type, $time, amount, rawDesc, $tags: [tag]
    });
  }

  return result;
}


function generateTransaction(inputs) {
  const { type, $time, amount, rawDesc, ...unusedProperties } = inputs;

  const result = { $time, amount, type, ...unusedProperties };
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
        $title = 'Bank transfer ' + (type === $DR ? 'from' : 'to') + ' ' + toTitleCase(toFrom);
      }

      break;

    case 'PR':
      $title = 'Purchase at ' + toTitleCase(desc);
      break;

    case 'SC':
      otherSide = AC_OTHER_EXPENSE;

      if (desc.includes('PREMIUM PLAN')) {
        $title = 'Premium plan banking fee';

      } else if (desc.includes('FULL PLAN FEE REBATE')) {
        $title = 'Premium Plan banking fee refund';
      }

      break;

    default:
  }

  Object.assign(result, { thisSide, otherSide, $title });

  return result;
}
