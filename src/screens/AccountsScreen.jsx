import React from 'react';
import { Button, Typography } from '@material-ui/core';
import { ArrowDropDown as ArrowDropDownIcon, ArrowDropUp as ArrowDropUpIcon } from '@material-ui/icons';

import ObjectEditor from '../ObjectEditor/index';
import { AccountTreeView, Modal } from '../components';
import { withSnackbar } from 'notistack';

import { AccountEditFormat, AccountCreateFormat } from '../ObjectEditor/ObjectFormats';

class AccountsScreen extends React.Component {
  state = {
    treeData: null,
    currentAccountValue: {},
    currentAccountId: null,

    selectedAccountId: null,
    selectedAccountName: '',
    selectedTransactionsSummary: {},
  }

  componentDidMount() {
    this.reloadAccountTree();
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

  onSave = async (aborting) => {
    if (aborting) return this.resetModal();

    if (this.state.currentAccountId === 'new') {
      try {
        await global.accountManager.create(this.state.currentAccountValue);
      } catch (error) { return alert(error); }

    } else {
      let newValue = Object.assign({}, this.state.currentAccountValue);
      const targetId = this.state.currentAccountId;
      delete newValue.id; delete newValue.isFolder; delete newValue.accountType;

      try {
        await global.accountManager.update(targetId, newValue);
      } catch (error) { return alert(error); }
    }
    this.props.enqueueSnackbar('Success!', { variant: 'success' });
    this.reloadAccountTree();
    this.resetModal();
  }

  onStartCreate = async () => {
    const currentAccountValue = {};

    if (this.state.selectedAccountId !== null && this.state.selectedAccountId !== 100) {
      const parent = await global.accountManager.get(this.state.selectedAccountId);
      currentAccountValue.accountType = parent.accountType;
      currentAccountValue.parentId = parent.id;
    }

    this.setState({ currentAccountId: 'new', currentAccountValue })
  }

  onStartEdit = async (id) => {
    const account = await global.accountManager.get(id);
    const accountValue = Object.assign({}, account);
    this.setState({ currentAccountValue: accountValue, currentAccountId: id });
  }

  onRemove = async () => {
    const targetId = this.state.currentAccountId;
    try {
      await global.accountManager.remove(targetId);
    } catch (error) { return alert(error); }

    this.props.enqueueSnackbar('Removed!', { variant: 'success' });
    this.reloadAccountTree();
    this.resetModal();
  }

  onSelectAccount = (selectedAccountId) => {
    this.setState({ selectedAccountId })
  }

  render() {
    return (
      <div style={{ display: 'flex' }}>
        <div style={{ flex: 1 }}>
          <Button color='primary' variant='outlined' onClick={this.reloadAccountTree}>Reload</Button>
          <Button color='primary' variant='outlined' onClick={this.onStartCreate}>New</Button>
          <Button color='primary' variant='outlined' onClick={() => this.onSelectAccount()}>Overview</Button>
          {
            this.state.treeData &&
            <AccountTreeView
              treeData={this.state.treeData}
              onEdit={this.onStartEdit}
              onClick={this.onSelectAccount}
            />
          }
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

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <ArrowDropUpIcon style={{ color: 'green' }} />
                {String(this.state.selectedTransactionsSummary.negativeChange) || '--'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <ArrowDropDownIcon style={{ color: 'red' }} />
                {String(this.state.selectedTransactionsSummary.positiveChange) || '--'}
              </div>
            </div>
            <div style={{ width: 1, backgroundColor: 'black', margin: '5px 20px', alignSelf: 'stretch' }}></div>
            <div style={{ fontSize: 26 }}>
              {String(this.state.selectedTransactionsSummary.final)}
            </div>
          </div>

          {/* <TransactionList /> */}
        </div>
      </div>
    );
  }
}

export default withSnackbar(AccountsScreen);
