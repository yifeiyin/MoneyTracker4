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

