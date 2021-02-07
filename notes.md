type:
	- text
	- multiline text
	- boolean
	- integer
	- select (choices: { value, label = value })
	- time/date/timedate
	- account

label

initialValue


tooltip



format: {
	title:
	fields: [
		{ 	key:
			label:
			type: 'input' | 'multiline' | 'boolean' | 'integer' |
			      'decimal' | 'monum' | 'datetime' | 'account'
			valueValidator: ''
			propertyType: 'mutable' | 'immutable'
		}
	]
}


TODO:
- Better transaction list component
- Global state using overmind, store pending transactions
- Clean up logic in accounts page
- Fix data management
- Add batch balance

-------

TODO:
- Add balance calculator
- Add batch balance
- Add index on debits/credits from

GOOD TO HAVE:
- Cache account id to names
- Fuzzy identify account by prefix name

IDEA: query language
- the result of a query is a collection
- possible conditions:
```
where ... < equals | startsWith > ...
[ reverse ] sortBy ...
limit ... offset ...      Automatically added for paging
```

- also need think about the following properties:
  - filter by tag, ex. import batch id

- With a collections, we can: delete all, update all

- highlight

```
filter where title startsWith 'purchase at'

filter where debit from transportation sort date


filter where credit from expense sort date reversed ?
filter where credit from expense rsort date ?

highlight yellow where ...

filter all sort
```

- predefined query
```
this week

this month

2020-12

2020-11--2020-12

2020-10-01--2020-12-31

last month
```



```
where time | debits/credits

and/filter

count + limit offset

reverse
sortBy
```

---------------

TODO:
- implement sort by, reverse
- implement where
- extend filter to highlight
- automatic paging
- delete all
- batch update
- add back the edit button for transactions

- old backlog: read only transaction list

- transaction list pop up window with a filter set?
  - make sure to have date first
  - or make another index: tag?

--------------------

NEXT:
- add tags to transactions: object editor, schema, database index
- adjust import scripts to add tags
- open a new window when imported: save all, discard all, close

PICK:
- filter where, tag
- highlight grammar
- adjust pagination logic

THEN:
- budget/summary page

LATER:
- better import rules
- balance



## Rule-based processor

```json
{
  "name/id": "",
  "group": "",
  "comments": "",
  "if": "***",
  "then": "***",
}
```

### Example
```json
{
  "if": "time.isBetween(2021-02-03, 2021-03-02)",
  "if": "title.contains(transfer)",
  "if": "otherSide.is(unknown expense)",
  "if": "customFunction",
  "then": "update(title, Superstore)",
  "then": "addTag(important)",
  "then": "dealWithUnknownCategory",
  "then": "skip"
}
```

### What actually happens
```json
// Same for "if" and "then"
{
  "field/subject": "time  or  extras.category.name",
  "op": "isBetween  or  is  or  <  or  =",
  "arguments": ["2021-02-07"],
}

{
  "field/subject": null,
  "op": "customFunction",
  "arguments": [],
}
```

### Alternative formats

```json
{
  "if": "time == 2020",

  "if": "title contains transfer",
  "if": "title ~= transfer",

  "if": "otherSide == 'unknown expense'",

  "if": "@customFunction",

  "then": "title := Superstore",

  "then": "tags.add(important)",
  "then": "tags.push(important)",
  "then": "tags.append(important)",
  "then": "tags += important",

  "then": "[dealWithUnknownCategory]",
  "then": "@dealWithUnknownCategory"
}
```

### Code setup
```js
processor = new Processor({
  rules: [rule1, rule2, rule3],
  functions: {
    customFunction: (object) => true,
    dealWithUnknownCategory: async () => "addTag(important)",
    dealWithUnknownCategory2: async (object) => resultObject,
  }
})

const { resultEntry, rulesTriggered, resultExplained } = processor.process(entry)
rulesTriggered = [{
  name/id: '',
  before?: {},
  after?: {},
  modifiedFields: [key],
  addedFields: [key],
  removedFields: [key],
}]

resultExplained = {
  'key': {
    finalValue: '1',
    initialValue: '',
    intermediates: [
      { by: '<original>?', newValue: '' },
      { by: 'name/id', newValue: '' },
      { by: 'name/id', newValue: '' },
    ]
  }
}
```

