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
  expect(consumeOperation(tokenize('where 1 > 2'))).toMatchObject({ operation: 'where', args: ['1', '>', '2'] })
  expect(consumeOperation(tokenize('cr acc'))).toMatchObject({ operation: 'credit', args: 'acc' })
  expect(consumeOperation(tokenize('dr acc'))).toMatchObject({ operation: 'debit', args: 'acc' })
  expect(consumeOperation(tokenize('acc'))).toMatchObject({ operation: 'account', args: 'acc' })
  expect(consumeOperation(tokenize('2020-12-12'))).toMatchObject({ operation: 'date', args: new Date(2020, 12, 12) })
  expect(consumeOperation(tokenize('2020-12-12--2020-12-14'))).toMatchObject({ operation: 'date-range', args: [new Date(2020, 12, 12), new Date(2020, 12, 14)] })
})

test('constructOperationList', () => {
  expect(constructOperationList(tokenize('2020-12-12--2020-12-14 cr acc')))
    .toMatchObject([
      { operation: 'date-range', args: [new Date(2020, 12, 12), new Date(2020, 12, 14)] },
      { operation: 'credit', args: 'acc' }
    ])
})
