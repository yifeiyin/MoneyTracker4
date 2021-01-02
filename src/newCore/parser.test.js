import { tokenize, constructOperationList, consumeOperation, toDate, toDateRange } from './parser'
import { OP_DATE_RANGE, OP_FUZZY_ACCOUNT, OP_WHERE } from './parser-operations'

test('tokenize', () => {
  expect(tokenize('')).toMatchObject([])
  expect(tokenize('1 2 3')).toMatchObject(['1', '2', '3'])
  expect(tokenize('1 "2" 3')).toMatchObject(['1', '2', '3'])
  expect(tokenize('1 "2 3"')).toMatchObject(['1', '2 3'])
  expect(tokenize('"1 2 3"')).toMatchObject(['1 2 3'])
  expect(tokenize('"1 \'2 3"')).toMatchObject(['1 \'2 3'])
})

test('consumeOperation', () => {
  const tests = {
    'where 1 > 2': new OP_WHERE({ op: '>', lhs: '1', rhs: '2' }),
    'cr acc': new OP_FUZZY_ACCOUNT({ type: 'credit', identifier: 'acc' }),
    'dr acc': new OP_FUZZY_ACCOUNT({ type: 'debit', identifier: 'acc' }),
    'acc': new OP_FUZZY_ACCOUNT({ type: 'any', identifier: 'acc' })
  }
  for (let [key, value] of Object.entries(tests))
    expect(consumeOperation(tokenize(key))).toMatchObject({ operation: value })
})

test('toDate', () => {
  expect(toDate('2020-09-10')).toMatchObject([new Date(2020, 8, 10), new Date(2020, 8, 11)])
  expect(toDate('2020-09')).toMatchObject([new Date(2020, 8, 1), new Date(2020, 9, 1)])
  expect(toDate('2020')).toMatchObject([new Date(2020, 0, 1), new Date(2021, 0, 1)])
})

test('toDateRange should use toDate', () => {
  expect(toDateRange('2020-09-10')).toMatchObject([new Date(2020, 8, 10), new Date(2020, 8, 11)])
  expect(toDateRange('2020-09')).toMatchObject([new Date(2020, 8, 1), new Date(2020, 9, 1)])
  expect(toDateRange('2020')).toMatchObject([new Date(2020, 0, 1), new Date(2021, 0, 1)])
})

test('toDateRange', () => {
  expect(toDateRange('2020-09-10--2020-09-10')).toMatchObject([new Date(2020, 8, 10), new Date(2020, 8, 11)])
  expect(toDateRange('2020-09--2021-01')).toMatchObject([new Date(2020, 8, 1), new Date(2021, 1)])
  expect(toDateRange('2020--2025')).toMatchObject([new Date(2020, 0, 1), new Date(2026, 0, 1)])
})

test('constructOperationList', () => {
  expect(constructOperationList(tokenize('2020-12-12--2020-12-14 cr acc')))
    .toMatchObject([
      new OP_DATE_RANGE({ start: new Date(2020, 11, 12), end: new Date(2020, 11, 15) }),
      new OP_FUZZY_ACCOUNT({ type: 'credit', identifier: 'acc' })
    ])
})
