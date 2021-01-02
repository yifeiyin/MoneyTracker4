import { OP_DATE_RANGE, OP_FUZZY_ACCOUNT, OP_HAS_TAG, OP_LIMIT, OP_OFFSET, OP_WHERE } from './parser-operations'

export function queryTableGetCollection(table, input) {
  const operations = constructOperationList(tokenize(input));
  let query = table;
  operations.forEach((operation) => {
    query = buildQuery(table, operation);
  })
  return query;
}

export function constructOperationList(tokens) {
  const operations = [];

  while (tokens.length !== 0) {
    let { operation, tokensLeft } = consumeOperation(tokens);
    operations.push(operation);
    tokens = tokensLeft;
  }

  return operations;
}

function buildQuery(data, operation) {
  if (data.toCollection) {
    return operation.queryTable(data);

  } else if (data.toArray) {
    return operation.queryCollection(data);

  } else if (data instanceof Array) {
    return data.filter((item) => operation.filter(item))

  } else {
    throw new Error('Unexpected data type', data);
  }
}


export function consumeOperation(tokens) {
  if (tokens.length === 0) return {};
  const arg0 = tokens[0]

  let op = null;
  switch (arg0.toLowerCase()) {
    case 'debit': case 'dr':
      op = new OP_FUZZY_ACCOUNT({ type: 'debit', identifier: tokens[1] })
      break;

    case 'credit': case 'cr':
      op = new OP_FUZZY_ACCOUNT({ type: 'credit', identifier: tokens[1] })
      break;

    case 'relate': case 'relates':
      op = new OP_FUZZY_ACCOUNT({ type: 'any', identifier: tokens[1] })
      break;

    case 'where':
      op = new OP_WHERE({ lhs: tokens[1], op: tokens[2], rhs: tokens[3] })
      break;

    case 'limit':
      op = new OP_LIMIT({ n: +tokens[1] })
      break;

    case 'offset':
      op = new OP_OFFSET({ n: +tokens[1] })
      break;

    case 'tag':
      op = new OP_HAS_TAG({ tag: tokens[1] })
      break;

    default:
      {
        let date;
        if ((date = toDateRange(arg0))) {
          op = new OP_DATE_RANGE({ start: date[0], end: date[1] })
          op.argCount = 1
          break;
        }
      }

      {
        let relativeDate;
        if (
          (relativeDate = toRelativeDateRange(arg0, tokens[1]))) {
          op = new OP_DATE_RANGE({ start: relativeDate[0], end: relativeDate[1] })
          op.argCount = 2
          break;
        }
      }

      op = new OP_FUZZY_ACCOUNT({ type: 'any', identifier: arg0 });
      op.argCount = 1
  }

  return { operation: op, tokensLeft: tokens.splice(op.actualArgCount) }
}

export function toRelativeDateRange(modifier, unit, now = null) {
  /**
   *                     a unit of time interval
   *                    |<          >|
   *                                       now
   *  past <<                               V                >> future
   *             -------|------------|-------~~~~~|~~~~~~~~
   *
   *                           |<   past   >|
   *                    |<   last   >|<   this   >|
   */
  try {
    modifier = modifier.toLowerCase();
    unit = unit.toLowerCase();
  } catch { return null; }

  if (!['this', 'past', 'last'].includes(modifier))
    return null;
  if (!['year', 'month', 'week'].includes(unit))
    return null;

  now = now || new Date();
  const combined = modifier + ' ' + unit;

  if (combined === 'past week') {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return [start, now];
  }

  if (combined === 'past month') {
    const start = new Date(now);
    // start.setMonth(start.getMonth() - 1);
    start.setDate(now.getDate() - 30);
    return [start, now];
  }

  if (combined === 'past year') {
    const start = new Date(now);
    start.setFullYear(now.getFullYear() - 1);
    start.setMonth(now.getMonth());
    start.setDate(now.getDate());
    return [start, now];
  }

  throw new Error('Not implemented')
}

export function toDate(str) {
  let match
  if ((match = str.match(/^(\d{4})-(\d{2})-(\d{2})$/))) {
    return [new Date(match[1], match[2] - 1, match[3]), new Date(match[1], match[2] - 1, 1 + +match[3])];
  } else if ((match = str.match(/^(\d{4})-(\d{2})$/))) {
    return [new Date(match[1], match[2] - 1, 1), new Date(match[1], match[2] - 1 + 1, 1)]
  } else if ((match = str.match(/^(\d{4})$/))) {
    return [new Date(match[1], 0, 1), new Date(1 + +match[1], 0, 1)]
  }
  return null;
}

export function toDateRange(str) {
  if (toDate(str))
    return toDate(str);

  let parts = str.split('--');
  if (parts.length !== 2) return null;
  let start = toDate(parts[0])
  let end = toDate(parts[1])

  if (start === null || end === null) return null;
  return [start[0], end[1]]
}

export function tokenize(input) {
  let inQuote = null;
  let result = [];
  let currentWord = [];
  for (let char of input.split('')) {
    if (char === inQuote) {
      inQuote = null;
      result.push(currentWord.join(''));
      currentWord = [];

    } else if (inQuote === null && (char === '"' || char === "'")) {
      inQuote = char;

      if (currentWord.length !== 0) {
        result.push(currentWord.join(''));
        currentWord = [];
      }

    } else if (inQuote === null && char === ' ') {
      if (currentWord.length !== 0) {
        result.push(currentWord.join(''));
        currentWord = [];
      }
    } else {
      currentWord.push(char);
    }
  }

  if (currentWord.length !== 0) {
    result.push(currentWord.join(''));
    currentWord = [];
  }

  return result;
}
