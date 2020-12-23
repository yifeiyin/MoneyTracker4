import React, { useEffect } from 'react';
import {
  Input,
  Select,
  MenuItem,
} from '@material-ui/core';
import {
  KeyboardDateTimePicker,
} from '@material-ui/pickers';

import Monum from '../newCore/monum'
import { getTodaysDateAt0000 } from '../newCore/helpers'

export default function ObjectEditorField(props) {
  // eslint-disable-next-line no-unused-vars
  const { id, value, type, label, propertyType, onChange } = props;

  const [monumInputValue, setMonumInputValue] = React.useState(null);
  useEffect(() => {
    if (type === 'monum') {
      if (monumInputValue === null)
        setMonumInputValue(value.toReadable());
    } else {
      setMonumInputValue('N/A');
    }
  }, [monumInputValue, type, value]);

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
      return (
        <Input
          value={monumInputValue}
          error={!isValidMonum(monumInputValue)}
          onChange={(e) => { setMonumInputValue(e.target.value); onChange(parseMonumOrZero(e.target.value)) }}
        />)

    case 'datetime':
      return <KeyboardDateTimePicker
        variant="inline"
        ampm={false}
        label={label || id}
        value={value === undefined ? getTodaysDateAt0000() : value}
        onChange={onChange}
        // onError={function () { console.warn(arguments) }}
        format="yyyy-MM-dd HH:mm"
      />

    case 'account':
      let { accountModalControl, placeholder } = props;
      return (<>
        <Select open={false} value={1} onOpen={() => accountModalControl.open(onChange)}>
          <MenuItem value={1}>
            {
              value === undefined || value === null ?
                placeholder || 'Please select' :
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
  try {
    parseMonum(input);
  } catch {
    return false;
  }
  return true;
}

function parseMonumOrZero(input) {
  try {
    return parseMonum(input);
  } catch { }
  return new Monum();
}

function parseMonum(input) {
  input = input.toUpperCase();
  let currencyFound;
  for (let currency of ['CAD', 'CNY', 'USD']) {
    if (input.includes(currency)) {
      if (currencyFound)
        throw new Error('Ambiguous currency: ' + currencyFound + ' and ' + currency);
      else
        currencyFound = currency;
    }
  }

  if (currencyFound === undefined) {
    currencyFound = 'CAD';
  }

  let currencyRemoved = input.replace(currencyFound, '');
  let currencyValueAsString = String(Number(currencyRemoved));

  return new Monum(currencyFound, currencyValueAsString);
}
