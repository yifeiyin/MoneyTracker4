import React from 'react';
// import { Button, IconButton, TextField } from '@material-ui/core';
// import { TreeView, TreeItem } from '@material-ui/lab';
// import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
// import ChevronRightIcon from '@material-ui/icons/ChevronRight';
// import EditIcon from '@material-ui/icons/Edit';

import ObjectEditor from '../ObjectEditor/index';
import { AccountTreeView } from '../components';
import { withSnackbar } from 'notistack';

const AccountFormat = {
  title: 'Account $name ($id)',
  fields: [
    { id: 'id', type: 'input', propertyType: 'immutable' },
    { id: 'name', type: 'input', },
    { id: 'parentId', type: 'account' },
    { id: 'isFolder', type: 'boolean', propertyType: 'immutable' },
    { id: 'accountType', type: 'select', choices: ['debit', 'credit'], propertyType: 'immutable' },
    { id: 'description', type: 'multiline' },
  ]
}

class AccountsScreen extends React.Component {
  state = {
    treeData: global.accountManager.getTreeData(),
    accountValue: {},
  }

  onEdit = (id) => {
    const account = global.accountManager._accountNodes[id];
    const accountValue = Object.assign({}, account);
    accountValue.id = id;
    this.setState({ accountValue });
  }

  onSave = () => {
    let newValue = Object.assign({}, this.state.accountValue);
    const targetId = newValue.id;
    delete newValue.id; delete newValue.isFolder; delete newValue.accountType;

    console.log(newValue);

    try {
      global.accountManager.changeAccountNodeProperty(targetId, newValue);
    } catch (error) {
      alert(error);
      return;
    }

    this.props.enqueueSnackbar('Success!', { variant: 'success' });

    this.setState({ treeData: global.accountManager.getTreeData() });
    this.onEdit(targetId);
  }

  render() {
    return (
      <>
        <AccountTreeView
          style={{ width: 300, float: 'left' }}
          treeData={this.state.treeData}
          onEdit={this.onEdit}
          onSave={this.onSave}
        />
        <ObjectEditor
          format={AccountFormat}
          values={this.state.accountValue}
          onChange={(accountValue) => this.setState({ accountValue })}
          onSave={this.onSave}
        />
      </>
    );
  }
}

export default withSnackbar(AccountsScreen);