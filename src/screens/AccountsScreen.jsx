import React from 'react';
import { Button, Typography } from '@material-ui/core';

import ObjectEditor from '../ObjectEditor/index';
import { AccountTreeView, Modal, TransactionList } from '../components';
import { withSnackbar } from 'notistack';

import { AccountEditFormat, AccountCreateFormat } from '../ObjectEditor/ObjectFormats';

class AccountsScreen extends React.Component {
  state = {
    treeData: global.accountManager.getTreeData(),
    currentAccountValue: {},
    currentAccountId: null,

    selectedAccountName: '',
  }

  componentDidMount() {
    this.onSelectAccount();
  }

  reloadAccountTree = () => {
    this.setState({ treeData: global.accountManager.getTreeData() });
  }

  resetModal = () => {
    this.setState({
      currentAccountId: null,
      currentAccountValue: {},
    });
  }

  onSave = (aborting) => {
    if (aborting) return this.resetModal();

    if (this.state.currentAccountId === 'new') {
      try {
        global.accountManager.createAccountNode(this.state.currentAccountValue);

      } catch (error) { return alert(error); }

    } else {

      let newValue = Object.assign({}, this.state.currentAccountValue);
      const targetId = this.state.currentAccountId;
      delete newValue.id; delete newValue.isFolder; delete newValue.accountType;

      try {
        global.accountManager.changeAccountNodeProperty(targetId, newValue);
      } catch (error) { return alert(error); }
    }
    this.props.enqueueSnackbar('Success!', { variant: 'success' });
    this.reloadAccountTree();
    this.resetModal();
  }

  onStartEdit = (id) => {
    const account = global.accountManager._accountNodes[id];
    const accountValue = Object.assign({}, account);
    accountValue.id = id;
    this.setState({ currentAccountValue: accountValue, currentAccountId: id });
  }

  onRemove = () => {
    const targetId = this.state.currentAccountId;
    try {
      global.accountManager.removeAccountNode(targetId);
    } catch (error) { return alert(error); }

    this.props.enqueueSnackbar('Removed!', { variant: 'success' });
    this.reloadAccountTree();
    this.resetModal();
  }

  onSelectAccount = (id) => {
    let name;
    if (!id) {
      id = String(global.accountManager._rootAccount);
      name = 'Overview';
    } else {
      name = global.accountManager.fromIdToName(id);
    }
    this.setState({ selectedAccountName: name });

    const allTransactionsObj = global.transactionContainer.getAllTransactions();
    const allTransactions = Object.keys(allTransactionsObj).map(k => ({ id: k, ...allTransactionsObj[k] }));
    const accountNodeHierarchy = global.accountManager._accountNodeHierarchy;
    const endAccountsToInclude = [];
    addChild(id, endAccountsToInclude);

    const toShow = allTransactions.filter(transaction => {
      const { debits, credits } = transaction;
      for (let [acc, monum] of debits) {
        if (endAccountsToInclude.includes(String(acc))) return true;
        console.assert(typeof (acc) === typeof (endAccountsToInclude[0]), 'Type is different', typeof (acc), typeof (endAccountsToInclude[0]), transaction.id);
      }
      for (let [acc, monum] of credits) {
        if (endAccountsToInclude.includes(String(acc))) return true;
        console.assert(typeof (acc) === typeof (endAccountsToInclude[0]), 'Type is different', typeof (acc), typeof (endAccountsToInclude[0]), transaction.id);
      }
      return false;
    });

    this.TransactionView.setData(toShow);

    function isEndNode(id) {
      return !global.accountManager._accountNodes[id].isFolder;
    }

    function addChild(currentTarget, result) {
      if (isEndNode(currentTarget)) {
        result.push(currentTarget);
        return;
      }
      for (let child of accountNodeHierarchy[currentTarget].children) {
        addChild(child, result);
      }
    }
  }

  render() {
    return (
      <div style={{ display: 'flex' }}>
        <div style={{ flex: 1 }}>
          <Button color='primary' variant='outlined' onClick={this.reloadAccountTree}>Reload</Button>
          <Button color='primary' variant='outlined' onClick={() => this.setState({ creatingNewAccount: true })}>New</Button>
          <Button color='primary' variant='outlined' onClick={() => this.onSelectAccount()}>Overview</Button>
          <AccountTreeView
            treeData={this.state.treeData}
            onEdit={this.onStartEdit}
            onClick={this.onSelectAccount}
          />
        </div>

        <Modal open={this.state.currentAccountId !== null} onModalRequestClose={() => this.onSave(true)}>
          <ObjectEditor
            format={this.state.currentAccountId === 'new' ? AccountCreateFormat : AccountEditFormat}
            values={this.state.currentAccountValue}
            onChange={(currentAccountValue) => this.setState({ currentAccountValue })}
            onSave={this.onSave}
            onRemove={this.onRemove}
          />
        </Modal>

        <div style={{ flex: 3 }}>
          <Typography variant='h4' align='center'>{this.state.selectedAccountName}</Typography>
          <TransactionList
            ref={(o) => this.TransactionView = o}
            viewOnly={true}
            onEditSave={() => { }}
            onCreateSave={() => { }}
            onRemove={() => { }}
          />
        </div>
      </div>
    );
  }
}

export default withSnackbar(AccountsScreen);
