import React from 'react';
import {
  Button,
  IconButton,
  Backdrop,
  Fade,
  Paper,
  Input,
  Modal,
  FormControl,
  FormGroup,
  TextField,
  Typography,
  Select,
  MenuItem,
  InputLabel,
} from '@material-ui/core';
import { AccountTreeView } from '../components';
// import {
//   MuiPickersUtilsProvider,
//   KeyboardTimePicker,
//   KeyboardDatePicker,
// } from '@material-ui/pickers';

export default class ObjectEditor extends React.Component {

  state = {
    showingAccountModal: false,
  }
  accountModalCallBack = null;

  onChange = (key, newValue) => {
    this.props.values[key] = newValue;
    this.props.onChange(this.props.values);
  }

  closeAccountModal = (id) => {
    this.setState({ showingAccountModal: false });
    if (!this.accountModalCallBack) console.error('this.accountModalCallBack is falsy');
    if (id !== null) this.accountModalCallBack(id);
  }

  render() {
    const { format, values, onSave } = this.props;
    return (
      <>
        <Typography variant='h4'>{templateString(format.title, values)}</Typography>
        <FormGroup row={true}>
          {
            format.fields.map(field =>
              <FormControl disabled={field.propertyType === 'immutable'} key={field.id} margin='normal' style={{ minWidth: '32%', margin: 1 }}>
                <InputLabel>{field.label || field.id}</InputLabel>
                <ObjectEditorField
                  {...field}
                  value={(values)[field.id]}
                  onChange={(v) => this.onChange(field.id, v)}
                  accountModalControl={{
                    open: (callback) => { this.accountModalCallBack = callback; this.setState({ showingAccountModal: true }) }
                  }}
                />
              </FormControl>
            )
          }
        </FormGroup>

        <Modal
          closeAfterTransition
          open={this.state.showingAccountModal}
          onClose={() => this.closeAccountModal(null)}
          BackdropComponent={Backdrop}
          BackdropProps={{ timeout: 500 }}
        ><Fade in={this.state.showingAccountModal}>
            <Paper style={{ width: '70vw', margin: 'auto', marginTop: 30, padding: 20 }}>
              <AccountTreeView
                treeData={global.accountManager.getTreeData()}
                onDoubleClick={(id) => this.closeAccountModal(id)}
              />
            </Paper>
          </Fade>
        </Modal>

        <Button variant='contained' color='primary' onClick={() => onSave ? onSave() : console.error('onSave is not defined.')}>Save</Button>
      </>
    );
  }
}


function ObjectEditorField(props) {
  const { id, value, type, label, propertyType, onChange } = props;
  switch (type) {

    case 'input':
      return <Input value={ensureDefined(value)} onChange={(e) => onChange(e.target.value)} />

    case 'multiline':
      return <Input value={ensureDefined(value)} onChange={(e) => onChange(e.target.value)} multiline />

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

    case 'select':
      let { choices } = props;
      if (typeof (choices[0]) !== 'object') choices = choices.map(choice => ({ value: choice }));
      return (
        <Select value={ensureDefined(value)} onChange={(e) => onChange(e.target.value)}>
          {
            choices.map(choice =>
              <MenuItem value={choice.value}>{choice.label || choice.value}</MenuItem>
            )
          }
        </Select>
      )
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
    default:
      return <div>Unknown type: {type}</div>
  }
}

function ensureDefined(value) {
  return value === undefined ? '' : value
}

function templateString(string, obj) {
  let s = string;
  for (let prop in obj) {
    s = s.replace(new RegExp('\\$' + prop, 'g'), obj[prop]);
  }
  return s;
}

