import { MonumCurrencySchema, MonumValueSchema, MonumSchema, AccountIdSchema, TransactionIdSchema } from './schema';

/**
 * MonumCurrencySchema
 */
testSchema(MonumCurrencySchema, '1', false);
testSchema(MonumCurrencySchema, 'CAD', 'CAD');
testSchema(MonumCurrencySchema, 'cad', 'CAD');
testSchema(MonumCurrencySchema, '', false);
testSchema(MonumCurrencySchema, undefined, false);
testSchema(MonumCurrencySchema, null, false);

/**
 * MonumValueSchema
 */
const tests = {
  'v': ['-1.2', '0', -1.2, 0, NaN, null, undefined],
  's': [true, true, false, false, false, false, false],
  'n': [true, true, true, true, false, true, true],
}

for (let i = 0; i < tests.v.length; i++) {
  testSchema(MonumValueSchema, tests.v[i], tests.n[i]);
  testSchema(MonumValueSchema.strict(), tests.v[i], tests.s[i]);
}

/**
 * MonumSchema
 */
testSchema(MonumSchema, { _class: 'monum' }, true);
testSchema(MonumSchema, { _class: 'monum', CAD: '1' }, true);
testSchema(MonumSchema, { _class: 'monum', CAD: '1.2' }, true);
testSchema(MonumSchema, { _class: 'monum', CAD: '-1.2' }, true);
testSchema(MonumSchema, {}, false);
testSchema(MonumSchema, { CAD: -1.2 }, false);
testSchema(MonumSchema, { _class: 'monum', CA1D: '-1.2' }, false);
testSchema(MonumSchema, { _class: 'monum', CAD: -1.2 }, false);


/**
 * AccountIdSchema
 */
testSchema(AccountIdSchema, null, false);
testSchema(AccountIdSchema, undefined, false);
testSchema(AccountIdSchema, '', false);
testSchema(AccountIdSchema, 0, false);
testSchema(AccountIdSchema, 99, false);
testSchema(AccountIdSchema, 100, true);
testSchema(AccountIdSchema, 487, true);

/**
 * TransactionIdSchema
 */
testSchema(TransactionIdSchema, null, false);
testSchema(TransactionIdSchema, undefined, false);
testSchema(TransactionIdSchema, '', false);
testSchema(TransactionIdSchema, 0, false);
testSchema(TransactionIdSchema, 100000, false);
testSchema(TransactionIdSchema, 100001, true);
testSchema(TransactionIdSchema, 458274, true);


/**
 * Helper
 */
function testSchema(schema, input, expectedState) {
  let result, error = null;
  try {
    result = schema.validateSync(input)
  } catch (err) {
    error = err;
  }

  /**
   * undefined: warn result
   * true: expected to pass
   * false: expected to fail
   * others: expected to pass and match the result
   */
  if (expectedState === undefined) {
    if (error === null) console.warn('RESULT:', result);
    else throw error;

  } else if (expectedState === true) {
    if (error === null) console.log('Passed:', result);
    else throw error;

  } else if (expectedState === false) {
    if (error === null) {
      console.warn(`(${typeof (result)})`, result)
      throw new Error('Expected to fail, but got above result');
    }
    else console.log('Passed:', error.message);

  } else {
    if (!error && expectedState === result) console.log('Passed: matched expected result');
    else {
      console.warn('Expecting:', expectedState);
      console.warn('But got:', result);
      throw new Error('Did not match expected result');
    }
  }
}
