export class Processor {

  constructor({ actions, conditions, rules }) {
    this.actions = actions;
    this.conditions = conditions;
    this.rules = rules;
  }

  /**
   * Sanity check: all rules contains known actions and conditions
   */
  async getErrors() {
    const errors = [];
    for (let rule of this.rules) {
      if (!(rule.if.func in this.conditions))
        errors.push(`cannot find condition '${rule.if.func}' from '${rule}'`)

      if (!(rule.then.func in this.actions))
        errors.push(`cannot find action '${rule.then.func}' from '${rule}'`)
    }

    return errors;
  }

  async process(source) {
    let result = {};
    const rulesMatched = [];
    for (let rule of this.rules) {
      if (await rule.matches(source, this.conditions)) {
        rulesMatched.push(rule);
        result = await rule.act(result, source, this.actions);
      }
    }

    return { result, source, rulesMatched }
  }
}



export class Rule {
  constructor({ if: if_, then }) {
    this.if = if_
    this.then = then
    if (!(this.if instanceof Statement))
      this.if = new Statement(this.if)
    if (!(this.then instanceof Statement))
      this.then = new Statement(this.then)
  }

  async matches(object, conditions) {
    const func = conditions[this.if.func];
    if (!func) throw new Error('did not receive condition named ' + this.if.func);
    const result = await func(object, this.if);
    if (typeof result !== 'boolean')
      throw new Error('condition function should give boolean result, got ' + typeof result);
    return result;
  }

  async act(result, source, actions) {
    const func = actions[this.then.func];
    if (!func) throw new Error('did not receive action named ' + this.then.func);
    return await func(result, this.then, source);
  }

  toString() {
    return `${this.if} -> ${this.then}`
  }
}



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

  if (args.length === 1 && /[~!@#$%^&*()_+-=><]{1,3}/.exec(func))
    return `${subj} ${func} ${args}`

  return (subj ? subj + '.' : '') + func + '(' + args.join(', ') + ')';
}


export function parseStatement(input) {
  let match;
  if ((match = /^([\w.]+) ([~!@#$%^&*()_+-=><]{1,3}) (.+?)$/.exec(input))) {
    return { subj: match[1], func: match[2], args: [sniffAndConvertType(match[3])] }
  }

  const { func, args } = _tokenizeWithoutSubjectWithoutShorthand(input)
  if (!func.includes('.'))
    return { func, args }

  const [subj, funcNew] = func.split('.', 2)
  return { subj, func: funcNew, args }
}

function _tokenizeWithoutSubjectWithoutShorthand(input) {
  let func = '';
  let args = [];

  if (!input.includes('(')) {
    func = input.trim()

    if (func.includes(')'))
      throw new Error('input contains extra closing parenthesis')

    ensureLegalFuncNameWithDots(func)

    return { func, args }
  }

  const result = /^([^(]+)\((.*?)\)$/.exec(input)

  if (result === null)
    throw new Error('input does not match expected pattern')

  func = result[1].trim()
  args = Boolean(result[2]) ? result[2].split(',') : []

  args = args.map((arg) => {
    arg = arg.trim()
    arg = sniffAndConvertType(arg)

    return arg
  })

  ensureLegalFuncNameWithDots(func)

  return { func, args }
}

function ensureLegalFuncNameWithDots(func) {
  if (!/^[\w.]+$/.exec(func) && !/[~!@#$%^&*()_+-=><]{1,3}/.exec(func))
    throw new Error('illegal function name: ' + func)
}

function sniffAndConvertType(arg) {
  if (!Number.isNaN(+arg) && arg !== '')
    return Number(arg)
  return arg
}
