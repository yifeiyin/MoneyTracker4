export class Statement {
  constructor(string) {
    this.internal = {};
    if (string) this.fromJSON(string);
  }

  fromJSON(json) {
    try {
      this.internal = parseStatement(json);
    } catch {
      this.internal = JSON.parse(json);
    }
    return this;
  }

  toJSON() {
    try {
      return basicStringify(this.internal);
    } catch {
      return JSON.stringify(this.internal);
    }
  }

  get subj() { return this.internal.subj; }
  get func() { return this.internal.func; }
  get args() { return this.internal.args; }
}

export function basicStringify(statement) {
  const { subj, func, args } = statement;

  for (let str of [func, subj, ...args].filter(Boolean))
    for (let nope of ['.', '(', ')', ','])
      if (typeof str === 'string' && str.includes(nope))
        throw new Error('Cannot stringify due to potentially ambiguous characters')

  return (subj ? subj + '.' : '') + func + '(' + args.join(', ') + ')';
}


export function parseStatement(input) {
  const { func, args } = _tokenizeWithoutSupportForSubject(input)
  if (!func.includes('.'))
    return { func, args }

  const [subj, funcNew] = func.split('.', 2)
  return { subj, func: funcNew, args }
}

function _tokenizeWithoutSupportForSubject(input) {
  let func = '';
  let args = [];

  if (!input.includes('(')) {
    func = input.trim()

    if (func.includes(')'))
      throw new Error('input contains extra closing parenthesis')
    if (func.length === 0)
      throw new Error('function name cannot be empty')

    return { func, args }
  }

  const result = /^([^(]+)\((.*?)\)$/.exec(input)

  if (result === null)
    throw new Error('input does not match expected pattern')

  func = result[1].trim()
  args = Boolean(result[2]) ? result[2].split(',') : []

  args = args.map((arg) => {
    arg = arg.trim()
    if (!Number.isNaN(+arg) && arg !== '')
      arg = Number(arg)

    return arg
  })

  if (func.length === 0)
    throw new Error('function name cannot be empty')

  return { func, args }
}
