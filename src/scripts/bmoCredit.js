import { toTitleCase, getNowDateTimeString } from '../newCore/helpers'

import {
  postProcess,
  $CR,
  $DR,
  processTransaction,
} from './helper'

export default async function csvToTransactions(input, overmind) {
  const result = [];
  const tag = 'import/credit@' + getNowDateTimeString();
  const transformed = transformStatement(input, tag);
  for (let transaction of transformed) {
    try {
      transaction = await processTransaction(
        { groupsToUse: ['mc0', 'mc1'], groupToAppend: 'mc1' },
        { masterCardGetAdditionalAttributesFromAPI },
        transaction,
        overmind
      );
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
  for (let line of lines.splice(9)) {
    if (line.trim() === '') continue;

    // eslint-disable-next-line no-unused-vars
    const [itemNumber, cardNumber, transactionDate, postingDate, amount0, desc] = line.split(',');
    if (!cardNumber.includes('51912')) throw new Error('Card number is different');

    const type = amount0.includes('-') ? $DR : $CR;
    const $time = new Date(transactionDate.substr(0, 4), transactionDate.substr(4, 2) - 1, transactionDate.substr(6, 2));
    const _postingDate = new Date(postingDate.substr(0, 4), postingDate.substr(4, 2) - 1, postingDate.substr(6, 2));
    const amount = amount0.replace(/-/, '');

    result.push({
      $time,
      $title: null,
      thisSide: 'BMO MasterCard',
      otherSide: null,
      type,
      amount,
      _rawDesc: desc,
      _postingDate,
      $tags: [tag],
    });
  }

  return result;
}



// ====================================================

async function masterCardGetAdditionalAttributesFromAPI(result, _, source) {
  return Object.assign(result, await getAdditionalAttributesFromAPI(source))
}

async function getAdditionalAttributesFromAPI(desc) {
  let details = await fetchDetails(desc)
  const result = {}
  if (details !== null) {
    const { address, merchantCategory, merchantDbaName, matchConfidenceScore } = details;

    result._address = toReadableAddress(address);
    result._category = toTitleCase(merchantCategory);
    result._merchantName = toTitleCase(merchantDbaName);
    result._masterCardAPIConfidence = matchConfidenceScore;
  }

  return result
}

function toReadableAddress(address) {
  const {
    city, line1, line2,
    country: { name: countryName },
    countrySubdivision: { name: countrySubdivisionName },
    postalCode
  } = address;

  const addressWithoutPostal = [line1, line2, city, countrySubdivisionName, countryName]
    .map(s => s.trim())
    .filter(Boolean).map(toTitleCase).join(', ');

  if (postalCode.trim()) {
    return addressWithoutPostal + ', ' + postalCode.trim().toUpperCase();
  } else {
    return addressWithoutPostal;
  }
}

async function fetchDetails(desc) {
  let response;
  try {
    response = await fetch('/get/' + encodeURIComponent(desc), { headers: { Accept: 'application/json' } });
  } catch (error) {
    console.warn(error);
    return null;
  }

  let text, result;
  try {
    text = await response.text();
    result = JSON.parse(text);
  } catch {
    console.warn(text);
  }

  if (result && result.match) return result.match;
  else {
    console.warn(result);
    return null;
  }
}
