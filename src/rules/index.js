const conditions = {
  '=': (obj, { subj, args }) => {
    return obj[subj] === args[0]
  },
  '>': (obj, { subj, args }) => {
    return obj[subj] === args[0]
  },
  '>=': (obj, { subj, args }) => {
    return obj[subj] === args[0]
  },
  '<': (obj, { subj, args }) => {
    return obj[subj] === args[0]
  },
  '<=': (obj, { subj, args }) => {
    return obj[subj] === args[0]
  },
}

const actions = {
  '=': (obj, { subj, args }) => {
    obj[subj] = args[0]
    return obj;
  },
}
