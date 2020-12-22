import { tokenize, consumeOperation, constructOperationList } from './parser'

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
  expect(consumeOperation(tokenize('2020-12-12'))).toMatchObject({ op: 'date', args: new Date(2020, 12, 12) })
  expect(consumeOperation(tokenize('2020-12-12--2020-12-14'))).toMatchObject({ op: 'date-range', args: [new Date(2020, 12, 12), new Date(2020, 12, 14)] })
})

test('constructOperationList', () => {
  expect(constructOperationList(tokenize('2020-12-12--2020-12-14 cr acc')))
    .toMatchObject([
      { op: 'date-range', args: [new Date(2020, 12, 12), new Date(2020, 12, 14)] },
      { op: 'credit', args: 'acc' }
    ])
})
