import { parseStatement, basicStringify, Statement } from './rule'

test('parseStatement basics', () => {
  expect(parseStatement('hi')).toMatchObject({ func: 'hi', args: [] })
  expect(parseStatement('hi()')).toMatchObject({ func: 'hi', args: [] })
  expect(parseStatement('hi(1)')).toMatchObject({ func: 'hi', args: [1] })
  expect(parseStatement('hi(1, 2)')).toMatchObject({ func: 'hi', args: [1, 2] })
  expect(parseStatement('hi(-1)')).toMatchObject({ func: 'hi', args: [-1] })
  expect(parseStatement('hi(abc)')).toMatchObject({ func: 'hi', args: ['abc'] })
  expect(parseStatement('hi(a,b)')).toMatchObject({ func: 'hi', args: ['a', 'b'] })
})

test('parseStatement whitespace', () => {
  expect(parseStatement(' hi(a b)')).toMatchObject({ func: 'hi', args: ['a b'] })
  expect(parseStatement('hi (a b)')).toMatchObject({ func: 'hi', args: ['a b'] })
  expect(parseStatement(' hi (a b)')).toMatchObject({ func: 'hi', args: ['a b'] })
  expect(parseStatement('hi(a, b)')).toMatchObject(parseStatement('hi(a,b)'))
  expect(parseStatement('hi(a b,  c d)')).toMatchObject(parseStatement('hi(a b,c d)'))
  expect(parseStatement('hi(a b )')).toMatchObject(parseStatement('hi(a b)'))
})

test('parseStatement error', () => {
  expect(() => parseStatement('')).toThrow()
  expect(() => parseStatement('hi((')).toThrow()
  expect(() => parseStatement('hi))')).toThrow()
  expect(() => parseStatement('hi(1)bb')).toThrow()
  expect(() => parseStatement('(hi)')).toThrow()
})

test('parseStatement subject', () => {
  expect(parseStatement('time.delete')).toMatchObject({ subj: 'time', func: 'delete', args: [] })
  expect(parseStatement('time = 2021-01-03')).toMatchObject({ subj: 'time', func: '=', args: ['2021-01-03'] })
  expect(parseStatement('time.=(2021-01-03)')).toMatchObject({ subj: 'time', func: '=', args: ['2021-01-03'] })
  expect(parseStatement('time > 1')).toMatchObject({ subj: 'time', func: '>', args: [1] })
  expect(parseStatement('time.>(1)')).toMatchObject({ subj: 'time', func: '>', args: [1] })
  expect(parseStatement('title.update(Purchase)')).toMatchObject({ subj: 'title', func: 'update', args: ['Purchase'] })
})

test('parseStatement simplified', () => {
  expect(parseStatement('desc ~= hi')).toMatchObject({ subj: 'desc', func: '~=', args: ['hi'] })
})


test('basicStringify', () => {
  const examples = [
    'hi()',
    'title.updateTo(hi)',
    'title.action(hi, there)',
    'title.action(-1, 1)',
    'action(-1, 1)',
    'a < -1',
    'a > hi',
    'a = hi',
    'a @= hi',
    'a +> hi there',
  ]

  examples.forEach((ex) => {
    expect(basicStringify(parseStatement(ex))).toMatch(ex)
    expect(new Statement(ex).toJSON()).toMatch(ex)
    expect(new Statement().fromJSON(ex)).toMatchObject(new Statement(ex))
  })
})
