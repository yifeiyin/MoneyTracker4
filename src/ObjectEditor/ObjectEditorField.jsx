import React from 'react';
import {
  Input,
  Select,
  MenuItem,
} from '@material-ui/core';
import {
  KeyboardTimePicker,
  KeyboardDatePicker,
  KeyboardDateTimePicker,
} from '@material-ui/pickers';


export default function ObjectEditorField(props) {
  const { id, value, type, label, propertyType, onChange } = props;
  switch (type) {
    case 'input':
      return <Input value={ensureDefined(value)} onChange={(e) => onChange(e.target.value)} />

    case 'multiline':
      return <Input value={ensureDefined(value)} onChange={(e) => onChange(e.target.value)} multiline />

    case 'boolean':
      return (
        <>
          <Select value={value === true ? 'true' : value === false ? 'false' : ''} onChange={(e) => onChange(e.target.value === 'true' ? true : e.target.value === 'false' ? false : undefined)}>
            <MenuItem value=''><em>None</em></MenuItem>
            <MenuItem value='true'>True</MenuItem>
            <MenuItem value='false'>False</MenuItem>
          </Select>
        </>
      )

    case 'select':
      let { choices } = props;
      if (typeof (choices[0]) !== 'object') choices = choices.map(choice => ({ value: choice }));
      return (
        <Select value={ensureDefined(value)} onChange={(e) => onChange(e.target.value)}>
          {
            choices.map(choice =>
              <MenuItem key={choice.value} value={choice.value}>{choice.label || choice.value}</MenuItem>
            )
          }
        </Select>
      )

    case 'monum':
      return <Input value={getMonumStringByPriority(value)} error={!isValidMonum(getMonumStringByPriority(value))} onChange={(e) => onChange(tryParseMonum(e.target.value))} />

    case 'datetime':
      return <KeyboardDateTimePicker
        variant="inline"
        ampm={false}
        label={label || id}
        value={value === undefined ? null : value}
        onChange={onChange}
        // onError={function () { console.warn(arguments) }}
        format="yyyy/MM/dd HH:mm"
      />

    case 'account':
      let { accountModalControl } = props;
      return (<>
        <Select open={false} value={1} onOpen={() => accountModalControl.open(onChange)}>
          <MenuItem value={1}>
            {
              value === undefined || value === null ?
                'Please select' :
                value + ' - ' + global.accountManager.fromIdToName(value)
            }
          </MenuItem>
        </Select>
      </>)



    default:
      return <div>Unknown type: {type}</div>
  }
}

function ensureDefined(value) {
  return value === undefined ? '' : value
}

function isValidMonum(input) {
  console.log(input);

  try {
    parseMonum(input);
  } catch {
    return false;
  }
  return true;
}

function getMonumStringByPriority(monum) {
  if (monum === undefined || monum === null || monum === '') {
    console.log('Monum', monum);
    return '';
  }
  return monum._rawInput === undefined ? monum.toString() : monum._rawInput;
}

function tryParseMonum(input) {
  console.log(input);
  let result = new global.Monum();
  try {
    result = parseMonum(input);
  } catch { }
  result._rawInput = input;
  return result;
}

function parseMonum(input) {
  const Monum = global.Monum;
  /* Example inputs
      10.2
      10
      cad 10
      cad10
      10cad
      10 cad
  */
  input = input.toUpperCase();
  let currencyFound;
  for (let currency of Monum.setup.acceptableCurrencies) {
    if (input.includes(currency)) {
      if (currencyFound)
        throw new Error('Ambiguous currency: ' + currencyFound + ' and ' + currency);
      else
        currencyFound = currency;
    }
  }
  if (currencyFound == undefined) {
    if (Monum.setup.defaultCurrency != undefined && Monum.setup.defaultCurrency != '') {
      currencyFound = Monum.setup.defaultCurrency;
    } else {
      throw new Error('Unable to find currency type, nor is a default one provided');
    }
  }
  let currencyRemoved = input.replace(currencyFound, '');
  // NOTE TO MYSELF (about the logic here):
  // Since eventually we are gonna store it in monum, we need to make sure
  // it is valid first. So we convert it into number then back to string, to
  // see if it is the string literal 'NaN'.
  let currencyValueAsString = String(Number(currencyRemoved));
  if (currencyValueAsString == 'NaN') {
    throw new Error('The number you entered does not seem to be a number');
  }
  return new Monum(currencyFound, currencyValueAsString);
}
