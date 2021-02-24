import Monum from '../monum'
import { BalanceAccumulator } from './balance-accumulator'

function generateFakeSide(account, amount) {
  return [{ acc: account, amt: new Monum('CAD', amount) }]
}

test('balance-accumulator very basic usage', () => {
  const selfBalanced = {
    debits: generateFakeSide(1, 100),
    credits: generateFakeSide(1, 99)
  }

  const a = new BalanceAccumulator(selfBalanced)

  expect(a.getAccountDebits(1)).toMatchObject(new Monum('CAD', 100))
  expect(a.getAccountCredits(1)).toMatchObject(new Monum('CAD', 99))

  expect(a.getAccountBalance(42))
    .toHaveProperty('balance', new Monum())

  expect(a.getAccountBalance(1))
    .toHaveProperty('balance', new Monum('CAD', 1))

  expect(a.getAccountBalance(1))
    .toHaveProperty('type', 'debit')
})
