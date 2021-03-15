import { CONDITIONS } from './presets'


test('~=', () => {
  const func = CONDITIONS['~=']

  expect(func(...generateCase('hi', 'hi'))).toBe(true)
  expect(func(...generateCase('AMAZON mkp', 'AMAZON mkp #29348'))).toBe(true)
  expect(func(...generateCase('amazon mkp', 'AMAZON mkp #29348'))).toBe(true)
  expect(func(...generateCase('Amazon mkp', 'AMAZON mkp #29348'))).toBe(false)
})

test('*=', () => {
  const func = CONDITIONS['*=']

  expect(func(...generateCase('hi', 'hi'))).toBe(true)
  expect(func(...generateCase('Amazon', 'AMAZON mkp #29348'))).toBe(false)
  expect(func(...generateCase('AMAZON', 'AMAZON mkp #29348'))).toBe(true)
  expect(func(...generateCase('amazon mkp 29348', 'AMAZON mkp #29348'))).toBe(true)
  expect(func(...generateCase('amazon 29348', 'AMAZON mkp #29348'))).toBe(true)
  expect(func(...generateCase('mkp amazon', 'AMAZON mkp #29348'))).toBe(false)
})


function generateCase(pattern, s) {
  return [
    { title: s },
    { subj: 'title', args: [pattern] }
  ]
}
