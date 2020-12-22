import Monum from '../newCore/monum';
import { toTitleCase } from '../newCore/helpers'

const $CR = 'credit';
const $DR = 'debit';

const AC_CHEQUING = 'BMO Chequing';
const AC_MASTER_CARD = 'BMO MasterCard';

const AC_GROCERY_EXPENSE = 'Grocery Expense';
const AC_TRANSPORTATION_EXPENSE = 'Transportation Expense';
const AC_SOCIAL_EXPENSE = 'Social Expense';
const AC_HOBBY_EXPENSE = 'Hobby Expense';
const AC_DINING_EXPENSE = 'Dining Expense';
const AC_SUBSCRIPTION_EXPENSE = 'Subscription Expense';
const AC_UNKNOWN_EXPENSE = 'Unknown Income/Expense';
const AC_OTHER_EXPENSE = 'Other Income/Expense';

const AC_ALL_EXPENSE = [
  AC_UNKNOWN_EXPENSE,
  AC_TRANSPORTATION_EXPENSE,
  AC_GROCERY_EXPENSE,
  AC_SOCIAL_EXPENSE,
  AC_HOBBY_EXPENSE,
  AC_DINING_EXPENSE,
  AC_SUBSCRIPTION_EXPENSE,
  AC_OTHER_EXPENSE,
];

export default async function csvToTransactions(input) {
  const result = [];
  const transformed = transformStatement(input);
  for (let transaction of transformed) {
    let a = await generateTransaction(transaction);
    a = await postProcess(a);
    result.push(a);
  }
  console.log(result)
  return result;
}

function transformStatement(originalStatement) {
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
      type, $time, amount, rawDesc: desc, _postingDate,
    });
  }

  return result;
}

async function generateTransaction(input) {
  const { type, rawDesc, amount, ...unusedInputs } = input;
  let thisSide = AC_MASTER_CARD,
    otherSide = AC_UNKNOWN_EXPENSE,
    $title = 'Untitled',
    additionalFields = {};

  if (rawDesc.startsWith('TRSF FROM/DE ACCT/CPT 3877')) {
    assert(type === $DR);
    $title = 'Transfer from chequing account';
    otherSide = AC_CHEQUING;

  } else if (rawDesc === 'AUTOMATIC PYMT RECEIVED') {
    assert(type === $DR);
    $title = 'Automatic payment';
    otherSide = AC_CHEQUING;

  } else {
    const json = await fetchDetails(rawDesc);
    if (json !== null) {

      const { address, merchantCategory, merchantDbaName, matchConfidenceScore } = json;

      additionalFields._address = toReadableAddress(address);
      additionalFields._category = toTitleCase(merchantCategory);
      additionalFields._merchantName = toTitleCase(merchantDbaName);
      additionalFields._masterCardAPIConfidence = matchConfidenceScore;

      if (!(merchantCategory in global.categories)) {

        let result = prompt(
          `We have not seen this category before:
${additionalFields._category}

Some info:
amt:  ${amount}
desc: ${rawDesc}
cat:  ${additionalFields._category}
name: ${additionalFields._merchantName}
conf: ${additionalFields._masterCardAPIConfidence}

Choose a category:
${AC_ALL_EXPENSE.map((v, i) => (i + 1) + ' ' + v).join('\n')}
`
        )

        if (result === 'stop') throw new Error('Stop');
        result = result || 1;

        global.categories[merchantCategory] = AC_ALL_EXPENSE[result - 1];
        localStorage.setItem('categories', JSON.stringify(global.categories))
      }

      otherSide = global.categories[merchantCategory];
      $title = 'Purchase at ' + toTitleCase(additionalFields._merchantName);
    }
  }

  return {
    thisSide,
    otherSide,
    type,
    $title,
    ...unusedInputs,
    ...additionalFields,
  }
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

function assert(condition, message) {
  if (!condition) throw new Error(message || "Assertion failed")
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
