import { toTitleCase, getNowDateTimeString, formatDate, assert } from '../newCore/helpers'

import { Processor, Rule } from '../rules'
import { ACTIONS, CONDITIONS } from './rules'

import {
  postProcess,
  $CR,
  $DR,
} from './helper'

export default async function csvToTransactions(input, overmind) {
  const result = [];
  const tag = 'import/credit@' + getNowDateTimeString();
  const transformed = transformStatement(input, tag);
  for (let transaction of transformed) {
    try {
      transaction = await processTransaction(transaction, overmind);
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

async function processTransaction(transaction, overmind) {
  const { rules: overmindRules } = overmind.state, { saveRules: overmindSaveRules } = overmind.actions;

  // Fetch and add the new fields
  Object.assign(transaction, await getAdditionalAttributesFromAPI(transaction._rawDesc))

  // Apply the rules
  const rulesUngrouped = ungroupAndParse(overmindRules)
  const processor = new Processor({ actions: ACTIONS, conditions: CONDITIONS, rules: rulesUngrouped })
  const { result } = await processor.process(transaction)
  Object.assign(transaction, result)

  // If otherSide is still null, ask user to identify
  if (transaction.otherSide === null) {
    await askToIdentify(transaction, { overmindRules, overmindSaveRules })
  }

  assert(transaction.$title && transaction.otherSide, 'title or otherSide is still falsy')

  return transaction;

  function ungroupAndParse(rules) {
    return rules.map(rule => rule.rules).flat().map(({ if: if_, then }) => new Rule({ if: if_, then: then }))
  }
}

/**
 * Ask user to create a rule, or enter a one-time title & category (aka otherSide)
 * for the transaction.
 *
 * The rule will be validated: it must apply to the transaction, and it must
 * not give error when applied. (However, account name resolution is handled in
 * postProcess and therefore cannot be validated here).
 *
 * This function modifies transaction IN PLACE and therefore does not have return
 * value.
 */
async function askToIdentify(transaction, { overmindRules, overmindSaveRules }) {
  const message = constructMessage(transaction)
  let default_ = `_rawDesc ~= ${transaction._rawDesc} -> tc(  ,  )`
  let result

  while (true) {
    result = prompt(message, default_)
    if (!result) {
      throw new Error('Empty input')
    }
    default_ = result

    try {
      if (result.includes('->')) {
        const [if_, then] = result.split('->').map(s => s.trim())
        const newRuleRaw = { if: if_, then }
        const newRule = new Rule(newRuleRaw)

        if (!await newRule.matches(transaction, CONDITIONS))
          throw new Error('The rule you entered does not apply to the transaction')

        let newProperties
        try {
          newProperties = await newRule.act({}, transaction, ACTIONS)
        } catch (error) {
          throw new Error(`Error when processing the new rule: ${error}`)
        }

        Object.assign(transaction, newProperties)

        if (transaction.otherSide === null)
          throw new Error('otherSide is still null; the rules will not be saved')

        const newRules = deepCopy(overmindRules)
        newRules.filter(rule => rule.id === 'bmoMasterCard')[0].rules.push(newRule.toJSON())
        overmindSaveRules(newRules)

      } else {
        // A one-time $title & category
        const [$title, category = 'unknown income/expense'] = result.split(',').map(s => s.trim())
        transaction.$title = $title
        transaction.otherSide = category
      }

    } catch (error) {
      result = prompt(`Error: ${error}\n\n` + message, default_)
      continue;
    }

    break;
  }


  // Helper methods

  function deepCopy(o) {
    return JSON.parse(JSON.stringify(o))
  }

  function constructMessage(transaction) {
    let message = ''
    for (let f in transaction) {
      message += `${f} - ${transaction[f] instanceof Date ? formatDate(transaction[f]) : transaction[f]}\n`
    }
    return message
  }
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
    const $time = new Date(transactionDate.substr(0, 4), transactionDate.substr(4, 2), transactionDate.substr(6, 2));
    const _postingDate = new Date(postingDate.substr(0, 4), postingDate.substr(4, 2), postingDate.substr(6, 2));
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
