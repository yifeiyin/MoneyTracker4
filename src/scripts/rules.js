import { postProcess } from "./helper"

const conditionsBasics = {
  'true': () => true,
  'false': () => false,

  '==': (source, { subj, args }) => {
    ensureOneArgument(args)
    switch (subj) {
      case 'amount':
        return Number(source[subj]) - Number(args[0]) < 0.001
      default:
        return source[subj] === args[0]
    }
  },

  /**
   * String contains word, smart case
   */
  '~=': (source, { subj, args }) => {
    ensureOneArgument(args)
    const caseSensitive = args[0].toLowerCase() !== args[0]
    const regex = new RegExp('(\\s|^)' + args[0] + '(\\s|$)', caseSensitive ? '' : 'i')
    return regex.test(source[subj])
  },

  /**
   * String contains character, smart case
   */
  '*=': (source, { subj, args }) => {
    ensureOneArgument(args)
    const caseSensitive = args[0].toLowerCase() !== args[0]
    const regex = new RegExp(args[0], caseSensitive ? '' : 'i')
    return regex.test(source[subj])
  },

  // unknownOtherSide(source) {
  //   return source.otherSide === null
  // }
}



const actionsBasics = {
  noop(result) { return result },
  ':=': (result, { subj, args }) => {
    ensureOneArgument(args)
    result[subj] = args[0]
    return result
  },

  tc(result, { args }) {
    result.$title = args[0]
    result.otherSide = args[1] ?? 'Other Income/Expense'
    return result
  }

  // addTag(result, { args }) {
  //   ensureOneArgument(args)
  //   result.tags = (result.tags ?? []).push(args[0])
  //   return result
  // },

  // initializeFields(result) {
  //   ensureDefined(result, ['tag', 'thisSide', '$time', 'type', 'amount', '_rawDesc'])
  //   return {
  //     $tags: [result.tag],
  //     thisSide: result.thisSide,
  //     $time: result.$time,
  //     type: result.type,
  //     amount: result.amount,
  //     otherSide: null,
  //     title: null,
  //     _rawDesc: result._rawDesc,
  //   }
  // },

  // postProcess(result) {
  //   return postProcess(result)
  // }
}



export const conditions = {
  ...conditionsBasics,
}

export const actions = {
  ...actionsBasics,
}


// ==================================================


function ensureOneArgument(args) {
  if (args.length !== 1) throw new Error('Expect 1 argument, got ' + args.length)
}

function ensureDefined(obj, fields) {
  for (let field of fields) {
    if (obj[field] === undefined)
      throw new Error(`field ${field} in ${JSON.stringify(obj)} must be defined`)
  }
}

/*
NOTES: For credit card

- transformStatement
  - csv to array
  - attach tag
  - sanity check account number
- generateTransaction
  - default thisSide, otherSide, title
  - check description for transfer
  - check description for auto payment
  - fetch details, transform & add new fields
  - check merchantCategory
  - ask if none matched
- postProcess


- transformStatement
  - csv to array
  - attach tag
  - sanity check account number
- generateTransaction
  - default thisSide, otherSide, title
  - check description for e-transfer
- postProcess

 */
