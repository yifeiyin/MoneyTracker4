import * as yup from 'yup';

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

export const AccountIdSchema = yup.number().min(100).max(999).required().strict();
export const TransactionIdSchema = yup.number().min(100001).required().strict();

export const AccountSchema = yup.object({
  id: AccountIdSchema,
  isFolder: yup.bool(),
  parentId: AccountIdSchema.nullable(),
  description: yup.string().notRequired(),
}).strict().noUnknown()

export const AccountAndAmountSchema = yup.object({
  acc: AccountIdSchema,
  amt: MonumSchema,
}).strict().noUnknown()

export const TransactionSchema = yup.object({
  id: TransactionIdSchema,
  time: yup.date().required(),
  title: yup.string().required().min(1),
  DRFrom: yup.string().required(),
  CRFrom: yup.string().required(),
  debits: yup.array(AccountAndAmountSchema).ensure(),
  credits: yup.array(AccountAndAmountSchema).ensure(),
  description: yup.string().notRequired(),
}).strict().noUnknown()

export const DefaultMonumSetup = {
  defaultCurrency: 'CAD',
  acceptableCurrencies: ['CAD', 'CNY', 'USD'],
}
