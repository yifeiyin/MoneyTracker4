import { Statement, Rule, Processor } from './index'

export const conditions = {
  '=': (source, { subj, args }) => {
    return source[subj] === args[0]
  },
  '>': (source, { subj, args }) => {
    return source[subj] > args[0]
  },
  '>=': (source, { subj, args }) => {
    return source[subj] >= args[0]
  },
  '<': (source, { subj, args }) => {
    return source[subj] < args[0]
  },
  '<=': (source, { subj, args }) => {
    return source[subj] <= args[0]
  },
}

export const actions = {
  '=': (result, { subj, args }) => {
    result[subj] = args[0]
    return result;
  },
}

const objects = [
  { a: 1, b: 2, c: 3 },
  { a: 2, b: 3, c: 4 },
  { a: 6, b: 4, c: 2 },
]

const expected = [
  { aGT5: 0, sumGT10: 0, average: 2 },
  { aGT5: 0, sumGT10: 0, average: 3 },
  { aGT5: 1, sumGT10: 1, average: 4 },
]

const rules = [
  new Rule({
    if: new Statement('true'),
    then: new Statement('initialize'),
  }),
  new Rule({
    if: new Statement('a > 5'),
    then: new Statement('aGT5 = 1'),
  }),
  new Rule({
    if: new Statement('sumGT(10)'),
    then: new Statement('sumGT10.=(1)'),
  }),
  new Rule({
    if: new Statement('true'),
    then: new Statement('setAverage()'),
  }),
]



test('usage example', async () => {
  const processor = new Processor({
    conditions: {
      ...conditions,
      'true': () => true,
      sumGT: (source, { args: [target] }) => source.a + source.b + source.c > target
    },
    actions: {
      ...actions,
      initialize: () => ({ aGT5: 0, sumGT10: 0, average: 0 }),
      setAverage: (result, _, source) => {
        result.average = (source.a + source.b + source.c) / 3;
        return result
      }
    },
    rules,
  })

  for (let i = 0; i < objects.length; i++) {
    const result = await processor.process(objects[i])
    expect(result.result).toMatchObject(expected[i])
  }
})
