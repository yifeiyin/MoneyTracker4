export const CONDITIONS = {
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
   * String contains individual set of characters, smart case
   */
  '*=': (source, { subj, args }) => {
    ensureOneArgument(args)
    const caseSensitive = args[0].toLowerCase() !== args[0]
    const subject = caseSensitive ? source[subj] : source[subj].toLowerCase()
    const words = args[0].split(' ').map(s => s.trim()).filter(Boolean)
    let nextSearchStartsFrom = 0;
    for (let word of words) {
      const index = subject.indexOf(word, nextSearchStartsFrom)
      if (index === -1) return false
      nextSearchStartsFrom = index + word.length
    }
    return true
  },
}


export const ACTIONS = {
  noop(result) { return result },
  ':=': (result, { subj, args }) => {
    ensureOneArgument(args)
    result[subj] = args[0]
    return result
  },

  tc(result, { args }) {
    result.$title = args[0]
    result.otherSide = args[1] ?? 'Unknown Income/Expense'
    return result
  }
}


// ==================================================

function ensureOneArgument(args) {
  if (args.length !== 1) throw new Error('Expect 1 argument, got ' + args.length)
}
