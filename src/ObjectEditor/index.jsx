import React from 'react';
import {
  Button,
  FormControl,
  FormGroup,
  Typography,
  InputLabel,
} from '@material-ui/core';
import { AccountTreeView } from '../components';
import { Modal } from '../components';
import DebitsCreditsEditor from './DebitsCreditsEditor';
import ObjectEditorField from './ObjectEditorField';

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
      <div>
        <Typography variant='h4'>{templateString(format.title, values)}</Typography>
        <FormGroup row={true}>
          {
            format.fields.map(field =>
              field.type === 'debits/credits' ?
                // <FormControl disabled={field.propertyType === 'immutable'} key={field.id[0]} margin='normal' style={{ minWidth: '90%', margin: 1 }}>
                <DebitsCreditsEditor key={field.id.toString()}
                  {...field} accountModalControl={this.accountModalControl}
                  value={[values[field.id[0]] || [], values[field.id[1]] || []]}
                  onChange={(debits, credits) => { if (debits !== null) this.onChange(field.id[0], debits); if (credits !== null) this.onChange(field.id[1], credits); }}
                />
                // </FormControl>
                :
                <FormControl key={field.id}
                  disabled={field.propertyType === 'immutable'}
                  margin='normal' style={{ minWidth: '32%', margin: 1 }}
                >
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

        <Modal open={this.state.showingAccountModal} onModalRequestClose={() => this.closeAccountModal(null)}>
          <AccountTreeView
            treeData={global.accountManager.getTreeData()}
            onDoubleClick={(id) => this.closeAccountModal(id)}
          />
        </Modal>

        <Button
          variant='contained' color='primary'
          onClick={() => onSave ? onSave() : console.error('onSave is not defined.')}
          style={{ margin: 15 }}
        >Save</Button>
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

