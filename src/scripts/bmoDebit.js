import bmoDebitCodeToReadableType from './bmoDebitCodeToReadable';
import { getNowDateTimeString, toTitleCase } from '../newCore/helpers'

import {
  postProcess,
  $CR,
  $DR,
  processTransaction,
} from './helper'

export default async function csvToTransactions(input, overmind) {
  const result = [];
  const tag = 'import/debit@' + getNowDateTimeString();
  const transformed = transformStatement(input, tag);
  for (let transaction of transformed) {
    try {
      transaction = await processTransaction({ groupsToUse: ['dc0', 'dc1'], groupToAppend: 'dc1' }, transaction, overmind);
      result.push(await postProcess(transaction));
    } catch (error) {
      if (!window.confirm(`ERROR: ${error}\n\nContinue?`)) {
        break;
      }
    }
  }
  alert('Done!')
  return result;
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

    // This can be done in a separate rule
    let code = desc.substr(1, 2);
    let _bmoTransType = bmoDebitCodeToReadableType[code] + ' (' + code + ')';
    const rawDesc = desc.substr(4).trim();

    result.push({
      $time,
      $title: null,
      thisSide: 'BMO Chequing',
      otherSide: null,
      type,
      amount,
      _rawDesc: rawDesc,
      _bmoTransType,
      $tags: [tag],
    });
  }

  return result;
}

export function debitCardETransfer(result, { args }, source) {

  const newAttributes = {}
  newAttributes._emtParty = toTitleCase(source._rawDesc.substr(25, 25).trim());
  newAttributes._emtRefNumber = source._rawDesc.substr(50, 17);

  if (args[0] === 'sent') {
    newAttributes.$title = `e-transfer to ${newAttributes._emtParty}`

  } else if (args[0] === 'received') {
    newAttributes.$title = `e-transfer from ${newAttributes._emtParty}`

  } else {
    throw new Error('Unexpected argument: ' + args[0])
  }

  return { ...result, ...newAttributes }
}

