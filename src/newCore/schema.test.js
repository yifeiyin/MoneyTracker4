import Monum from './monum';
import { MonumCurrencySchema, MonumValueSchema, MonumSchema, AccountIdSchema, AccountIdNullableSchema, TransactionIdSchema, AccountSchema, TransactionSchema } from './schema';
let name, count = 1;

/**
 * MonumCurrencySchema
 */
testing('MonumCurrencySchema')
testSchema(MonumCurrencySchema, '1', false);
testSchema(MonumCurrencySchema, 'CAD', 'CAD');
testSchema(MonumCurrencySchema, 'cad', 'CAD');
testSchema(MonumCurrencySchema, '', false);
testSchema(MonumCurrencySchema, undefined, false);
testSchema(MonumCurrencySchema, null, false);

/**
 * MonumValueSchema
 */
testing('MonumValueSchema')
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
testing('MonumSchema')
testSchema(MonumSchema, { CAD: '1' }, true);
testSchema(MonumSchema, { CAD: '1.2' }, true);
testSchema(MonumSchema, { CAD: '-1.2' }, true);
testSchema(MonumSchema, {}, true);
testSchema(MonumSchema, { CAD: -1.2 }, false);
testSchema(MonumSchema, { CA1D: '-1.2' }, false);
testSchema(MonumSchema, { CAD: -1.2 }, false);

/**
 * AccountIdSchema
 */
testing('AccountIdSchema')
testSchema(AccountIdSchema, null, false);
testSchema(AccountIdSchema, undefined, false);
testSchema(AccountIdSchema, '', false);
testSchema(AccountIdSchema, 0, false);
testSchema(AccountIdSchema, 99, false);
testSchema(AccountIdSchema, 100, true);

testSchema(AccountIdNullableSchema, null, true);
testSchema(AccountIdNullableSchema, undefined, false);

/**
 * TransactionIdSchema
 */
testing('TransactionIdSchema')
testSchema(TransactionIdSchema, null, false);
testSchema(TransactionIdSchema, undefined, false);
testSchema(TransactionIdSchema, '', false);
testSchema(TransactionIdSchema, 0, false);
testSchema(TransactionIdSchema, 100000, false);
testSchema(TransactionIdSchema, 100001, true);
testSchema(TransactionIdSchema, 458274, true);

/**
 * AccountSchema
 */
testing('AccountSchema')
const asset = {
  parentId: 100,
  name: 'Asset',
  accountType: 'debit',
  isFolder: true,
}
testSchema(AccountSchema.omit(['id']), { ...asset }, true)
testSchema(AccountSchema, Object.assign({ ...asset }, { id: 101 }), true)


/**
 * TransactionSchema
 */
testing('TransactionSchema - as single object')
testSchema(TransactionSchema, {
  id: 999999,
  time: new Date(),
  title: 'hi',
  debits: { acc: 100, amt: new Monum() },
  credits: { acc: 100, amt: new Monum() }
}, true);

testing('TransactionSchema - as array')
testSchema(TransactionSchema, {
  id: 999999,
  time: new Date(),
  title: 'hi',
  debits: [{ acc: 100, amt: new Monum() }],
  credits: [{ acc: 100, amt: new Monum() }]
}, true);

testing('TransactionSchema - not balanced')
testSchema(TransactionSchema, {
  id: 999999,
  time: new Date(),
  title: 'hi',
  debits: { acc: 100, amt: new Monum('CAD', '1') },
  credits: { acc: 100, amt: new Monum('CAD', '2') }
}, false);


/**
 * Helper
 */
function testing(newName) {
  name = newName;
  count = 1;
}

function testSchema(schema, input, expectedState) {
  test(`Test ${name} #${count++} (${typeof (input)}) ${input} -> (${typeof (expectedState)}) ${expectedState}`, () => {
    if (expectedState === undefined) {
      expect(schema.validateSync(input)).toBeDefined();

    } else if (expectedState === true) {
      expect(schema.validateSync(input)).toBeDefined();

    } else if (expectedState === false) {
      expect(() => schema.validateSync(input)).toThrow();

    } else {
      expect(schema.validateSync(input)).toBe(expectedState);
    }
  })
}
