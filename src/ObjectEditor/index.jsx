import React from 'react';
import {
  Button,
  ButtonGroup,
  FormControl,
  FormGroup,
  Typography,
  InputLabel,
} from '@material-ui/core';
import { AccountTreeView } from '../components';
import { Modal } from '../components';
import DebitsCreditsEditor from './DebitsCreditsEditor';
import ObjectEditorField from './ObjectEditorField';

import {
  Add as AddIcon,
} from '@material-ui/icons';


export default class ObjectEditor extends React.Component {
  state = {
    showingAccountModal: false,
    accountTreeData: null,
  }

  accountModalCallBack = null;

  async componentDidMount() {
    const accountTreeData = await global.accountManager.getTreeData()
    this.setState({ accountTreeData })
  }

  onChange = (key, newValue) => {
    if (newValue === undefined)
      delete this.props.values[key];
    else
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
      <div>
        {/* ======== Title ======== */}
        {
          !format.title ? null :
            <Typography variant='h4'>{templateString(format.title, values)}</Typography>
        }

        <FormGroup className="main-form-components-container" row={true}>

          {/* ======== Main Components ======== */}
          {
            format.fields.map(field =>
              field.type === 'debits/credits' ?
                <DebitsCreditsEditor
                  key={field.id.toString()}
                  {...field}
                  accountModalControl={this.accountModalControl}
                  value={[values[field.id[0]] || [], values[field.id[1]] || []]}
                  onChange={(debits, credits) => {
                    if (debits !== null) this.onChange(field.id[0], debits);
                    if (credits !== null) this.onChange(field.id[1], credits);
                  }}
                />
                :
                <FormControl key={field.id}
                  disabled={field.propertyType === 'immutable'}
                  margin='normal' style={{ minWidth: '32%', margin: 1 }}
                >
                  {
                    // Show labels unless the component provides its own
                    ['date', 'time', 'datetime', 'array-of-string'].includes(field.type) ? null :
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

          {/* ======== Custom Property Editor ======== */}
          {
            format.disableCustomProperties === true ? null :
              <div className='custom-property-editor-container'>
                <div className='custom-property-editor-header'>
                  <Typography variant='h5' display='inline'>Custom Properties</Typography>

                  <Button
                    color='primary' variant='outlined' size='small' style={{ margin: 5 }} startIcon={<AddIcon />}
                    onClick={() => {
                      const newPair = global.prompt('Enter a key-value pair: (use space to separate)', 'key value');
                      if (newPair === null) return;
                      let [key, ...value] = newPair.split(' ');
                      value = value.join(' ');
                      if (value === undefined) { return alert('No value was detected!'); }
                      this.onChange(key, value);
                    }}
                  >Add New</Button>
                </div>
                {
                  Object.keys(values).filter(k => !format.fields.map(f => f.id).flat().includes(k)).map(key =>
                    <ButtonGroup color='primary' size='small' style={{ margin: 5 }} key={key}>
                      <Button onClick={() => {
                        if (global.confirm(`Confirm delete key ${key}?`))
                          this.onChange(key, undefined);
                      }}>{key}</Button>

                      <Button onClick={() => {
                        const newValue = global.prompt(`Editing ${key}:`, values[key]);
                        if (newValue !== null) this.onChange(key, newValue);
                      }}>{JSON.stringify(values[key])}</Button>
                    </ButtonGroup>
                  )
                }
              </div>
          }
        </FormGroup>

        {/* ======== Account Selection Modal ======== */}
        <Modal open={this.state.showingAccountModal} onModalRequestClose={() => this.closeAccountModal(null)}>
          <AccountTreeView
            treeData={this.state.accountTreeData}
            onDoubleClick={(id) => this.closeAccountModal(id)}
          />
        </Modal>

        {/* ======== Actions ======== */}
        {
          format.actions === undefined ?
            <Button
              variant='contained' color='primary'
              onClick={() => onSave && onSave()}
              style={{ margin: 15 }}
            >{format.saveButtonText || 'Save'}</Button> :
            format.actions.map(({ text, callback, type }) =>
              <Button
                key={text}
                variant='contained' color={type === 'delete' ? 'secondary' : 'primary'}
                onClick={() => { if (this.props[callback]) this.props[callback](); else console.error(`this.props.${callback} is not callable.`); }}
                style={{ margin: 15 }}
              >{text}</Button>
            )
        }
      </div>
    );
  }
}


function templateString(string, obj) {
  let s = string;
  for (let prop in obj) {
    s = s.replace(new RegExp('\\$' + prop, 'g'), obj[prop]);
  }
  return s;
}

