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

  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@material-ui/core';
import { AccountTreeView } from '../components';
import {
  KeyboardTimePicker,
  KeyboardDatePicker,
  KeyboardDateTimePicker,
} from '@material-ui/pickers';

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

  accountModalControl = {
    open: (callback) => { this.accountModalCallBack = callback; this.setState({ showingAccountModal: true }) }
  }

  render() {
    const { format, values, onSave } = this.props;
    return (
      <>
        <Typography variant='h4'>{templateString(format.title, values)}</Typography>
        <FormGroup row={true}>
          {
            format.fields.map(field =>
              field.type === 'debits/credits' ?
                <FormControl disabled={field.propertyType === 'immutable'} key={field.id} margin='normal' style={{ minWidth: '90%', margin: 1 }}>
                  <DebitsCreditsEditor
                    {...field} accountModalControl={this.accountModalControl}
                    value={[values[field.id[0]] || [], values[field.id[1]] || []]}
                    onChange={(debits, credits) => { if (debits !== null) this.onChange(field.id[0], debits); if (credits !== null) this.onChange(field.id[1], credits); }}
                  />
                </FormControl>
                :
                <FormControl disabled={field.propertyType === 'immutable'} key={field.id} margin='normal' style={{ minWidth: '32%', margin: 1 }}>
                  {
                    // Show labels unless the component provides its own
                    ['date', 'time', 'datetime'].includes(field.type) ? null :
                      <InputLabel>{field.label || field.id}</InputLabel>
                  }
                  <ObjectEditorField
                    {...field}
                    value={(values)[field.id]}
                    onChange={(v) => this.onChange(field.id, v)}
                    accountModalControl={this.accountModalControl}
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

        <Button
          variant='contained' color='primary'
          onClick={() => onSave ? onSave() : console.error('onSave is not defined.')}
          style={{ margin: 15 }}
        >Save</Button>
      </>
    );
  }
}

function DebitsCreditsEditor(props) {
  const { id, value, label, propertyType, onChange, accountModalControl } = props;
  console.log(props);
  const [idForDebits, idForCredits] = id;
  const [labelForDebits, labelForCredits] = label || id;
  console.log(value);
  const [debits, credits] = value;
  const length = Math.max(debits.length, credits.length) + 1;

  return (
    <div style={{ display: 'flex', justifyContent: 'space-around' }}>
      <div style={{ marginRight: 5 }}>
        <Typography variant='h6' align='center'>Debits</Typography>
        {
          debits.map(([targetAcc, monum], index) =>
            <div style={{ display: 'flex' }} key={idForDebits + index}>
              <span style={{ flex: 2 }}>
                <ObjectEditorField
                  value={targetAcc} type='account' label={'Debits ' + index} accountModalControl={accountModalControl}
                  onChange={(newTargetAcc) => { debits[index][0] = newTargetAcc; onChange(debits, null) }}
                />
              </span>
              <span style={{ flex: 1 }}>
                <ObjectEditorField
                  value={monum} type='monum' label={'Debits' + index}
                  onChange={(newMonum) => { debits[index][1] = newMonum; onChange(debits, null) }}
                />
              </span>
            </div>
          )
        }
      </div>
      <div style={{ marginLeft: 5 }}>
        <Typography variant='h6' align='center'>Credits</Typography>
        {
          credits.map(([targetAcc, monum], index) =>
            <div style={{ display: 'flex' }} key={idForCredits + index}>
              <span style={{ flex: 2 }}>
                <ObjectEditorField
                  value={targetAcc} type='account' label={'Credits ' + index} accountModalControl={accountModalControl}
                  onChange={(newTargetAcc) => { credits[index][0] = newTargetAcc; onChange(null, credits) }}
                />
              </span>
              <span style={{ flex: 1 }}>
                <ObjectEditorField
                  value={monum} type='monum' label={'Credits' + index}
                  onChange={(newMonum) => { credits[index][1] = newMonum; onChange(null, credits) }}
                />
              </span>
            </div>
          )
        }
      </div>
    </div>
    // <TableContainer component={Paper}>
    //   <Table>
    //     <TableHead>
    //       <TableRow>
    //         <TableCell>Debits</TableCell>
    //         <TableCell>Credits</TableCell>
    //       </TableRow>
    //     </TableHead>
    //     <TableBody>
    //       {

    //       }
    //     </TableBody>
    //   </Table>
    // </TableContainer>
  );
}


function ObjectEditorField(props) {
  const { id, value, type, label, propertyType, onChange } = props;
  switch (type) {

    case 'input': case 'monum':
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

function templateString(string, obj) {
  let s = string;
  for (let prop in obj) {
    s = s.replace(new RegExp('\\$' + prop, 'g'), obj[prop]);
  }
  return s;
}

