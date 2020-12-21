import * as yup from 'yup';
import Monum from './monum';

export const MonumCurrencySchema = yup.string().matches(/^[a-zA-Z]+$/).uppercase().required();
export const MonumValueSchema = yup.string().ensure().test('currency value', 'currency value is invalid', (value) => String(Number(value)) !== 'NaN');

export const MonumSetupSchema = yup.object({
  defaultCurrency: MonumCurrencySchema.required().nullable(),
  acceptableCurrencies: yup.array(MonumCurrencySchema).required(),
}).strict().noUnknown()

export const MonumSchema = yup.object({})
  .test('test monum key and values', (obj) => {
    for (let [k, v] of Object.entries(obj)) {
      if (k === '_class') continue;
      MonumCurrencySchema.strict().validateSync(k)
      MonumValueSchema.strict().validateSync(v)
    }
    return true;
  })

export const AccountIdSchema = yup.number().min(100).max(999).required('account id is required').strict();
export const AccountIdNullableSchema = AccountIdSchema.notRequired().defined('parent id must be defined').nullable(true);
export const TransactionIdSchema = yup.number().min(100001).required().strict();

export const AccountSchema = yup.object({
  id: AccountIdSchema,
  parentId: AccountIdNullableSchema,
  name: yup.string().required().min(1),
  accountType: yup.string().oneOf(['debit', 'credit']).required(),
  isFolder: yup.bool().required(),
  description: yup.string().notRequired(),
}).strict().noUnknown().test('valid parentId', 'parentId can only be null for root', (obj) => {
  return obj.id === 100 || AccountIdSchema.isValidSync(obj.parentId)
})

export const AccountAndAmountSchema = yup.object({
  acc: AccountIdSchema,
  amt: MonumSchema,
}).strict().noUnknown()

export const AccountAndAmountListSchema = yup.array(AccountAndAmountSchema).ensure()

export const TransactionSchema = yup.object({
  id: TransactionIdSchema,
  time: yup.date().required(),
  title: yup.string().required().min(1),
  // DRFrom: yup.string().required(),
  // CRFrom: yup.string().required(),
  debits: AccountAndAmountListSchema,
  credits: AccountAndAmountListSchema,
  description: yup.string().notRequired(),
})
  .strict(false)
  .noUnknown(false)
  .test('is balanced', 'is not balanced', (obj) => {
    return Monum.combine(...obj.debits.map(i => i.amt)).neg().add(...obj.credits.map(i => i.amt)).isZero()
  })

export const DefaultMonumSetup = {
  defaultCurrency: 'CAD',
  acceptableCurrencies: ['CAD', 'CNY', 'USD'],
}

export const AccountDatabaseSchema = yup.array(AccountSchema)
export const TransactionDatabaseSchema = yup.array(TransactionSchema)
