import React from 'react';
import { Button } from '@material-ui/core';


// import { TreeView, TreeItem } from '@material-ui/lab';
// import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
// import ChevronRightIcon from '@material-ui/icons/ChevronRight';
// import EditIcon from '@material-ui/icons/Edit';

import ObjectEditor from '../ObjectEditor/index';
import { AccountTreeView, Modal } from '../components';
import { withSnackbar } from 'notistack';

import { AccountEditFormat, AccountCreateFormat } from '../ObjectEditor/ObjectFormats';

class AccountsScreen extends React.Component {
  state = {
    treeData: global.accountManager.getTreeData(),
    accountValue: {},
    creatingNewAccount: false,
    creatingNewAccountValue: {},
  }

  reloadAccountTree = () => {
    this.setState({ treeData: global.accountManager.getTreeData() });
  }

  onSaveNewAccount = (aborting) => {
    if (!aborting) {
      try {
        global.accountManager.createAccountNode(this.state.creatingNewAccountValue);
        this.props.enqueueSnackbar('Created!', { variant: 'success' });
        this.reloadAccountTree();
      } catch (error) {
        alert(error);
        return;
      }
    }

    this.setState({ creatingNewAccount: false, creatingNewAccountValue: {} });
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

    this.reloadAccountTree();
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
        <Button color='primary' variant='outlined' onClick={this.reloadAccountTree}>Reload Account Tree</Button>
        <Button color='primary' variant='outlined' onClick={() => this.setState({ creatingNewAccount: true })}>Creating New Account</Button>
        <ObjectEditor
          format={AccountEditFormat}
          values={this.state.accountValue}
          onChange={(accountValue) => this.setState({ accountValue })}
          onSave={this.onSave}
        />

        <Modal open={this.state.creatingNewAccount} onModalRequestClose={() => this.onSaveNewAccount(true)}>
          <ObjectEditor
            format={AccountCreateFormat}
            values={this.state.creatingNewAccountValue}
            onChange={(creatingNewAccountValue) => this.setState({ creatingNewAccountValue })}
            onSave={this.onSaveNewAccount}
          />
        </Modal>
      </>
    );
  }
}

export default withSnackbar(AccountsScreen);