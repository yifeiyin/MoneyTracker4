import { tokenize, consumeOperation, constructOperationList, toDate, toDateRange } from './parser'

test('tokenize', () => {
  expect(tokenize('')).toMatchObject([])
  expect(tokenize('1 2 3')).toMatchObject(['1', '2', '3'])
  expect(tokenize('1 "2" 3')).toMatchObject(['1', '2', '3'])
  expect(tokenize('1 "2 3"')).toMatchObject(['1', '2 3'])
  expect(tokenize('"1 2 3"')).toMatchObject(['1 2 3'])
  expect(tokenize('"1 \'2 3"')).toMatchObject(['1 \'2 3'])
})

test('consumeOperation', () => {
  expect(consumeOperation(tokenize('where 1 > 2'))).toMatchObject({ op: 'where', args: ['1', '>', '2'] })
  expect(consumeOperation(tokenize('cr acc'))).toMatchObject({ op: 'credit', args: 'acc' })
  expect(consumeOperation(tokenize('dr acc'))).toMatchObject({ op: 'debit', args: 'acc' })
  expect(consumeOperation(tokenize('acc'))).toMatchObject({ op: 'account', args: 'acc' })
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
      { op: 'date-range', args: [new Date(2020, 11, 12), new Date(2020, 11, 15)] },
      { op: 'credit', args: 'acc' }
    ])
})
