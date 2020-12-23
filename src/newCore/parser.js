export function queryTableGetCollection(table, input) {
  const [first, ...operations] = constructOperationList(tokenize(input));
  if (first === undefined) return table.toCollection();
  let query = buildQueryForTable(table, first);
  for (let operation of operations) {
    query = buildQueryForCollection(query, operation);
  }
  return query;
}

function buildQueryForTable(table, { op, args }) {
  switch (op) {
    case 'debit':
      return table.where('_debits').startsWith(accountIdentifierToPath(args));

    case 'credit':
      return table.where('_credits').startsWith(accountIdentifierToPath(args));

    case 'account':
      return table.where('_debitsCredits').startsWith(accountIdentifierToPath(args));

    case 'date-range': {
      const start = args[0];
      const end = args[1];
      return table.where('time').between(start, end);
    }

    case 'tag': {
      return table.where('tags').equals(args);
    }

    default:
      return buildQueryForCollection(table, { op, args });
  }
}

function buildQueryForCollection(collection, { op, args }) {
  switch (op) {
    case 'debit':
      return collection.filter((obj) => obj._debits.includes(accountIdentifierToPath(args)));

    case 'credit':
      return collection.filter((obj) => obj._credits.includes(accountIdentifierToPath(args)));

    case 'account':
      return collection.filter((obj) => obj._debitCredits.includes(accountIdentifierToPath(args)));

    case 'date-range': {
      const start = args[0];
      const end = args[1]; end.setDate(end.getDate() + 1);
      return collection.filter((obj) => start <= obj.time && obj.time < end);
    }

    case 'where': {
      // const [lhs, operator, rhs] = args;
      // TODO: where
      return collection;
    }

    case 'tag': {
      return collection.filter((obj) => obj.tags.includes(args));
    }

    case 'limit':
      return collection.limit(args)

    case 'offset':
      return collection.offset(args)

    default:
      throw new Error(`Unknown op: ${op}`)
  }
}

function accountIdentifierToPath(name) {
  return global.accountManager.fuzzyFindGetPath(name);
}

export function constructOperationList(tokens) {
  const operations = [];

  while (tokens.length !== 0) {
    let { op, args, tokensLeft } = consumeOperation(tokens);
    operations.push({ op, args });
    tokens = tokensLeft;
  }

  return operations;
}

export function consumeOperation(tokens) {
  if (tokens.length === 0) return {};
  const arg0 = tokens[0]

  let op = '', args = [], argConsumed = 0;
  switch (arg0.toLowerCase()) {
    case 'debit': case 'dr':
      op = 'debit'
      args = tokens[1]
      argConsumed = 1
      break;

    case 'credit': case 'cr':
      op = 'credit'
      args = tokens[1]
      argConsumed = 1
      break;

    case 'relate': case 'relates':
      op = 'account'
      args = tokens[1]
      argConsumed = 1
      break;

    case 'where':
      op = 'where'
      args = [tokens[1], tokens[2], tokens[3]]
      argConsumed = 3
      break;

    case 'limit':
      op = 'limit'
      args = +tokens[1]
      argConsumed = 1
      break;

    case 'offset':
      op = 'offset'
      args = +tokens[1]
      argConsumed = 1
      break;

    case 'tag':
      op = 'tag'
      args = tokens[1]
      argConsumed = 1
      break;

    default:
  }

  if (!op) {
    if (toDateRange(arg0)) {
      op = 'date-range'
      args = toDateRange(arg0)
      argConsumed = 0

    } else {
      op = 'account'
      args = arg0
      argConsumed = 0
    }
  }

  if (args === undefined || (args instanceof Array && args.includes(undefined))) {
    throw new Error('Unexpected undefined argument for operation ' + op)
  }

  return { op, args, tokensLeft: tokens.splice(argConsumed + 1) }
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
