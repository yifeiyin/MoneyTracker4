import * as yup from 'yup';

class OP {
  constructor(arg) {
    if (this.constructor.schema)
      this.constructor.schema.validateSync(arg);
    Object.assign(this, arg);
  }

  get defaultArgCount() { return Object.keys(this.constructor.schema.fields).length + 1; }
  get actualArgCount() { return this.argCount === undefined ? this.defaultArgCount : this.argCount; }
  /**
   * Assign to `this.argCount` to override the default
   */

  NOT_SUPPORTED() { throw new Error('Not supported', this) }

  queryTable(table) {
    /** Fall back to queryCollection */
    return this.queryCollection(table.toCollection())
  }

  queryCollection(collection) {
    /** Fall back to filter */
    return collection.filter((item) => this.filter(item));
  }

  filter() {
    throw new Error('Not implemented')
  }
}


export class OP_FUZZY_ACCOUNT extends OP {
  static schema = yup.object({
    type: yup.string().oneOf(['debit', 'credit', 'any']).required(),
    identifier: yup.string().required(),
  }).strict().noUnknown()

  queryTable(table) {
    switch (this.type) {
      case 'debit':
        return table.where('_debits').startsWith(identifierToPath(this.identifier));
      case 'credit':
        return table.where('_credits').startsWith(identifierToPath(this.identifier));
      case 'any':
        return table.where('_debitsCredits').startsWith(identifierToPath(this.identifier));
      default:
        throw new Error('Unreachable');
    }
  }

  filter(item) {
    switch (this.type) {
      case 'debit':
        return item.debits.map(({ acc }) => acc).map(idToPath).some((path) => path.startsWith(identifierToPath(this.identifier)));
      case 'credit':
        return item.credits.map(({ acc }) => acc).map(idToPath).some((path) => path.startsWith(identifierToPath(this.identifier)));
      case 'any':
        return [...item.debits, ...item.credits].map(({ acc }) => acc).map(idToPath).some((path) => path.startsWith(identifierToPath(this.identifier)));
      default:
        throw new Error('Unreachable');
    }
  }
}


export class OP_DATE_RANGE extends OP {
  static schema = yup.object({
    start: yup.DateSchema,
    end: yup.DateSchema,
  }).strict().noUnknown()

  queryTable(table) {
    return table.where('time').between(this.start, this.end);
  }

  filter(item) {
    return this.start <= item.time && item.time < this.end;
  }
}

export class OP_WHERE extends OP {
  static schema = yup.object({
    lhs: yup.mixed().defined(),
    op: yup.string().oneOf(['<', '>', '=', 'has']).required(),
    rhs: yup.mixed().defined(),
  }).strict().noUnknown()

  filter(item) {
    if (this.lhs.toLowerCase() === 'title' && this.op === 'has') {
      return item.title.toLowerCase().includes(this.rhs.toLowerCase())
    }

    if (this.lhs === 'tag' && this.op === 'has') {
      return item.tags.includes(this.rhs)
    }

    throw new Error('Unsupported where clause');
  }
}


export class OP_HAS_TAG extends OP {
  static schema = yup.object({
    tag: yup.string().required(),
  }).strict().noUnknown()

  filter(item) {
    return item.tags.includes(this.tag);
  }
}


export class OP_LIMIT extends OP {
  static schema = yup.object({
    n: yup.number().integer().required()
  }).strict().noUnknown()

  queryCollection(collection) {
    return collection.limit(this.n);
  }

  filter = this.NOT_SUPPORTED;
}


export class OP_OFFSET extends OP {
  /** Deprecated */
  static schema = yup.object({
    n: yup.number().integer().required(),
  }).strict().noUnknown()

  queryCollection(collection) {
    return collection.offset(this.n);
  }

  filter = this.NOT_SUPPORTED;
}

function identifierToPath(name) {
  return global.accountManager.fuzzyFindGetPath(name);
}

// function identifierToId(name) {
//   return global.accountManager.fuzzyFindGetId(name);
// }

function idToPath(id) {
  return global.accountManager.getPath(id);
}
