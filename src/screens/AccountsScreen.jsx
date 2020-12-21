import React from 'react';
import { Button, Typography } from '@material-ui/core';
import { ArrowDropDown as ArrowDropDownIcon, ArrowDropUp as ArrowDropUpIcon } from '@material-ui/icons';

import ObjectEditor from '../ObjectEditor/index';
import { AccountTreeView, Modal, TransactionList } from '../components';
import { withSnackbar } from 'notistack';

import { AccountEditFormat, AccountCreateFormat } from '../ObjectEditor/ObjectFormats';

class AccountsScreen extends React.Component {
  state = {
    treeData: null,
    currentAccountValue: {},
    currentAccountId: null,

    selectedAccountName: '',
    selectedTransactionsSummary: {},
  }

  componentDidMount() {
    this.reloadAccountTree();
    // this.onSelectAccount();
  }

  reloadAccountTree = async () => {
    this.setState({ treeData: await global.accountManager.getTreeData() });
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

  //  onSelectAccount = async (id) => {
  //   let name;
  //   if (!id) {
  //     id = 100;
  //     name = 'Overview';
  //   } else {
  //     name = global.accountManager.fromIdToName(id);
  //   }

  //   const targetAccountType = global.accountManager._accountNodes[id].accountType;
  //   console.assert(['debit', 'credit'].includes(targetAccountType), 'Unexpected value: ' + targetAccountType);
  //   const [transactionsForThisAccount, accountsIncluded] = getTransactionsForAccount(id);
  //   this.TransactionView.setData(transactionsForThisAccount);
  //   const selectedTransactionsSummary = getTransactionsSummary(transactionsForThisAccount, accountsIncluded, targetAccountType);

  //   this.setState({ selectedAccountName: name, selectedTransactionsSummary });
  // }

  render() {
    return (
      <div style={{ display: 'flex' }}>
        <div style={{ flex: 1 }}>
          <Button color='primary' variant='outlined' onClick={this.reloadAccountTree}>Reload</Button>
          <Button color='primary' variant='outlined' onClick={() => this.setState({ currentAccountId: 'new' })}>New</Button>
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

/*
function getTransactionsForAccount(id) {

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

  return [toShow, endAccountsToInclude];

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


function getTransactionsSummary(transactions, accounts, accountType) {
  const Monum = global.Monum;
  const initial = new Monum();

  let debitChange = new Monum(), creditChange = new Monum();
  for (let transaction of transactions) {
    const { debits, credits } = transaction;
    for (let [targetAcc, monum] of debits) {
      if (accounts.includes(targetAcc))
        debitChange = Monum.combine(debitChange, monum);
    }

    for (let [targetAcc, monum] of credits) {
      if (accounts.includes(targetAcc))
        creditChange = Monum.combine(creditChange, monum);
    }
  }

  let final, netChange, positiveChange, negativeChange;
  if (accountType === 'debit') {
    positiveChange = debitChange;
    negativeChange = creditChange;

  } else if (accountType === 'credit') {
    positiveChange = creditChange;
    negativeChange = debitChange;

  } else {
    throw new Error('Unexpected value accountType: ' + accountType);
  }

  netChange = positiveChange.sub(negativeChange);
  final = initial.add(netChange);

  return {
    count: transactions.length,
    initial,
    final,
    netChange,
    positiveChange,
    negativeChange,
  };
}
*/

export default withSnackbar(AccountsScreen);
