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
