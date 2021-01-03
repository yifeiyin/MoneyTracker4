import Monum from './monum'

test('Basic construction', () => {
  expect(new Monum().toString()).toBe('||')
  expect(new Monum('CAD', '123').toString()).toBe('|CAD 123|')
  expect(new Monum('CAD', -1).toString()).toBe('|CAD -1|')
  expect(new Monum('cad', '-1').toString()).toBe('|CAD -1|')
  expect(() => new Monum('cad', 'hah').toString()).toThrow()
  expect(() => new Monum('1aa', -1).toString()).toThrow()
})

const cad1 = new Monum('CAD', 1);
const cadN1 = new Monum('CAD', -1);
const cny1 = new Monum('CNY', 1);


test('Add combine', () => {
  expect(cad1.add(cad1).toString()).toBe('|CAD 2|')
  expect(cad1.add(cny1).toString()).toBe('|CAD 1+CNY 1|')
  expect(cny1.add(cad1).toString()).toBe('|CNY 1+CAD 1|')
  expect(cad1.add(new Monum('CAD', '-1')).toString()).toBe('||')
  expect(Monum.combine(new Monum('CAD', -1), new Monum('CNY', 100)).toString()).toBe('|CAD -1+CNY 100|')
})

test('sub neg', () => {
  expect(cad1.neg()).toMatchObject(cadN1)
  expect(cadN1.neg()).toMatchObject(cad1)
  expect(cadN1.sub(cad1)).toMatchObject(new Monum())
  expect(cny1.sub(cadN1)).toMatchObject(cny1.add(cad1))
})

test('isZero isNotZero', () => {
  expect(cad1.sub(cad1).isZero()).toBe(true)
  expect(cad1.sub(cad1).isNotZero()).toBe(false)
  expect(cny1.sub(cad1).isZero()).toBe(false)
  expect(cny1.sub(cad1).isNotZero()).toBe(true)
  expect(new Monum().isZero()).toBe(true)
})

test('isPositive isNegative', () => {
  expect(cad1.isPositive()).toBe(true)
  expect(cad1.isNegative()).toBe(false)
  expect(cny1.isPositive()).toBe(true)
  expect(cny1.neg().isNegative()).toBe(true)
  expect(new Monum().isPositive()).toBe(false)
  expect(new Monum().isNegative()).toBe(false)
})

test('fromJSON toJSON', () => {
  expect(Monum.fromJSON('||')).toMatchObject(new Monum())
  expect(Monum.fromJSON('|CAD 1|')).toMatchObject(new Monum('CAD', '1'))
  expect(Monum.fromJSON(cad1.toJSON())).toMatchObject(cad1)
})
