import Monum from '../newCore/monum';
import { assert, formatDate } from '../newCore/helpers'
import { ACTIONS, CONDITIONS } from './rules'
import { Rule, Processor } from '../rules'

export const $CR = 'credit';
export const $DR = 'debit';

// export const AC_CHEQUING = 'BMO Chequing';
// export const AC_SAVING = 'BMO Saving';
// export const AC_MASTER_CARD = 'BMO MasterCard';

// export const AC_GROCERY_EXPENSE = 'Grocery Expense';
// export const AC_TRANSPORTATION_EXPENSE = 'Transportation Expense';
// export const AC_SOCIAL_EXPENSE = 'Social Expense';
// export const AC_HOBBY_EXPENSE = 'Hobby Expense';
// export const AC_DINING_EXPENSE = 'Dining Expense';
// export const AC_SUBSCRIPTION_EXPENSE = 'Subscription Expense';
// export const AC_UNKNOWN_EXPENSE = 'Unknown Income/Expense';
// export const AC_OTHER_EXPENSE = 'Other Income/Expense';

// export const AC_ALL_EXPENSE = [
//   AC_UNKNOWN_EXPENSE,
//   AC_TRANSPORTATION_EXPENSE,
//   AC_GROCERY_EXPENSE,
//   AC_SOCIAL_EXPENSE,
//   AC_HOBBY_EXPENSE,
//   AC_DINING_EXPENSE,
//   AC_SUBSCRIPTION_EXPENSE,
//   AC_OTHER_EXPENSE,
// ];



export async function processTransaction({ groupsToUse, groupToAppend }, transaction, overmind) {
  const { rules: overmindRules } = overmind.state, { saveRules: overmindSaveRules } = overmind.actions;

  // Apply the rules
  const rulesUngrouped = ungroupAndParse(groupsToUse, overmindRules)
  const processor = new Processor({ actions: ACTIONS, conditions: CONDITIONS, rules: rulesUngrouped })
  const { result } = await processor.process(transaction)
  Object.assign(transaction, result)

  // If otherSide is still null, ask user to identify
  if (transaction.otherSide === null) {
    await askToIdentify(groupToAppend, transaction, { overmindRules, overmindSaveRules })
  }

  assert(transaction.$title && transaction.otherSide, 'title or otherSide is still falsy')

  return transaction;

  function ungroupAndParse(groupsToUse, rules) {
    return rules.filter(rule => groupsToUse.includes(rule.id)).map(rule => rule.rules).flat().map(({ if: if_, then }) => new Rule({ if: if_, then: then }))
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
export async function askToIdentify(groupToAppend, transaction, { overmindRules, overmindSaveRules }) {
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
        newRules.filter(rule => rule.id === groupToAppend)[0].rules.push(newRule.toJSON())
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


export async function postProcess(raw) {
  let { type, thisSide, otherSide, amount } = raw;

  const thisSideAcc = await global.accountManager.fuzzyFindGetId(thisSide);
  const otherSideAcc = await global.accountManager.fuzzyFindGetId(otherSide);
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

    } else if (key.startsWith('_')) {
      // Keep them as custom fields
      const newKey = key.substr(1);

      let str = raw[key];

      if (typeof str !== 'string')
        if (str instanceof Date)
          str = str.toJSON();
        else if (typeof str === 'number')
          str = '' + str;
        else
          str = JSON.stringify(str);

      raw[newKey] = str;
    }

    // If the field does not starts with $ or _, remove it
    delete raw[key];
  }

  return raw;
}
