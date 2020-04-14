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

