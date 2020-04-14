import React from 'react';
import { Button, IconButton, Input, InputBase, FormControl, FormGroup, TextField, Typography, Select, MenuItem, InputLabel } from '@material-ui/core';

// To load data: call setData
// To get data: onSave

export default class ObjectEditor extends React.Component {

  onChange = (key, newValue) => {
    this.props.values[key] = newValue;
    this.props.onChange(this.props.values);
  }

  render() {
    const { format, values } = this.props;
    return (
      <>
        <Typography variant="h4">{templateString(format.title, values)}</Typography>
        <FormGroup row={true}>
          {
            format.fields.map(field =>
              <FormControl margin="normal">
                <InputLabel>{field.label || field.id}</InputLabel>
                <ObjectEditorField
                  key={field.id}
                  {...field}
                  value={(values)[field.id]}
                  onChange={(v) => this.onChange(field.id, v)}
                />
              </FormControl>
            )
          }
        </FormGroup>
      </>
    );
  }
}


function ObjectEditorField(props) {
  const { id, value, type, label, propertyType, onChange } = props;
  switch (type) {
    case 'input':
      return <Input value={value || ''} onChange={(e) => onChange(e.target.value)} />
    case 'multiline':
      return <Input value={value || ''} onChange={(e) => onChange(e.target.value)} multiline />
    case 'boolean':
      return (
        <>
          <Select value={value === true ? 'true' : value === false ? 'false' : ''} onChange={(newValue) => onChange(newValue === 'true' ? true : newValue === 'false' ? false : undefined)}>
            <MenuItem value=''><em>None</em></MenuItem>
            <MenuItem value='true'>True</MenuItem>
            <MenuItem value='false'>False</MenuItem>
          </Select>
        </>
      )
    default:
      return <div>Unknown type: {type}</div>
  }
}


function templateString(string, obj) {
  let s = string;
  for (let prop in obj) {
    s = s.replace(new RegExp('\\$' + prop, 'g'), obj[prop]);
  }
  return s;
}
