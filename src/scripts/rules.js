export const conditions = {
  'true': () => true,
}

export const actions = {

}

/*
NOTES: For credit card

- transformStatement
  - csv to array
  - attach tag
  - sanity check account number
- generateTransaction
  - default thisSide, otherSide, title
  - check description for transfer
  - check description for auto payment
  - fetch details, transform & add new fields
  - check merchantCategory
  - ask if none matched
- postProcess


- transformStatement
  - csv to array
  - attach tag
  - sanity check account number
- generateTransaction
  - default thisSide, otherSide, title
  - check description for e-transfer
- postProcess

 */
