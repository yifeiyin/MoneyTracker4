export function constructOperationList(tokens) {
  const operations = [];

  while (tokens.length !== 0) {
    let { operation, args, tokensLeft } = consumeOperation(tokens);
    operations.push({ operation, args });
    tokens = tokensLeft;
  }

  return operations;
}

export function consumeOperation(tokens) {
  if (tokens.length === 0) return {};
  const arg0 = tokens[0]

  let operation = '', args = [], argConsumed = 0;
  switch (arg0.toLowerCase()) {
    case 'debit': case 'dr':
      operation = 'debit'
      args = tokens[1]
      argConsumed = 1
      break;

    case 'credit': case 'cr':
      operation = 'credit'
      args = tokens[1]
      argConsumed = 1
      break;

    case 'where':
      operation = 'where'
      args = [tokens[1], tokens[2], tokens[3]]
      argConsumed = 3
      break;

    case 'limit':
      operation = 'limit'
      args = tokens[1]
      argConsumed = 1
      break;

    case 'offset':
      operation = 'offset'
      args = tokens[1]
      argConsumed = 1
      break;

    default:
  }

  if (!operation) {
    if (toDate(arg0)) {
      operation = 'date'
      args = toDate(arg0)
      argConsumed = 0

    } else if (toDateRange(arg0)) {
      operation = 'date-range'
      args = toDateRange(arg0)
      argConsumed = 0

    } else {
      operation = 'account'
      args = arg0
      argConsumed = 0
    }
  }

  if (args === undefined || (args instanceof Array && args.includes(undefined))) {
    throw new Error('Unexpected undefined argument for operation ' + operation)
  }

  return { operation, args, tokensLeft: tokens.splice(argConsumed + 1) }
}


export function toDate(str) {
  let match = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return new Date(match[1], match[2], match[3]);
  } else {
    return null;
  }
}

export function toDateRange(str) {
  let parts = str.split('--');
  if (parts.length !== 2) return null;
  let start = toDate(parts[0])
  let end = toDate(parts[1])

  if (start === null || end === null) return null;
  return [start, end]
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
