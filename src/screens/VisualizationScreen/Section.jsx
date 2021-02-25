import React from 'react'
import { Button } from '@material-ui/core'
import { formatDate, sumOfAccountAndAmountList, BalanceAccumulator } from '../../newCore/helpers'
import { queryTableGetCollection } from '../../newCore/parser'

import AccountPicker from '../../ObjectEditor/AccountPicker'

export default class Section extends React.Component {
  AccountPicker = null;

  state = {
    accountId: null,
    accountName: 'Please select',
    transactions: [],
    transactionSummary: '',
  }

  pick = async () => {
    const accountId = await this.AccountPicker.pick()
    if (accountId === null) return;

    const accountName = await global.accountManager.fromIdToName(accountId);
    this.setState({ accountName });

    const date = '2021-01'

    const transactions =
      await queryTableGetCollection(
        global.transactionManager.table,
        `${date} relate '${accountName}'`
      ).toArray()
    this.setState({ transactions })

    const ba = new BalanceAccumulator(transactions)
    const transactionSummary =
      `CR ${ba.getAccountCredits(accountId).toReadable()}` +
      ` -- DR ${ba.getAccountDebits(accountId).toReadable()}` +
      ` -- ${ba.getAccountBalance(accountId).balance.toReadable()}`
    this.setState({ transactionSummary })
  }

  render() {
    return (
      <div>
        <Button color="primary" variant="outlined" onClick={() => this.pick()}>{this.state.accountName}</Button>
        <span>{this.state.transactionSummary}</span>
        <AccountPicker ref={(ref) => this.AccountPicker = ref} />
        <details>
          <summary>{this.state.transactions.length + ' transaction(s).'}</summary>
          <TransactionTableSimplified transactions={this.state.transactions} />
        </details>
      </div>
    )
  }
}


function TransactionTableSimplified({ transactions }) {
  return transactions.map(transaction =>
    <TransactionTableBodyCells key={transaction.id} transaction={transaction} />
  )
}

function TransactionTableBodyCells({ transaction }) {
  const { id, time, title, debits, credits } = transaction;
  const readable = [stringifyAccountsAndAmounts(debits), stringifyAccountsAndAmounts(credits)]

  return (
    <div className="transaction-row">
      <div data-type="id">{id}</div>
      <div data-type="time">{formatDate(time, false)}</div>
      <div data-type="title">{title}</div>
      <div data-type="debit">{readable[0]}</div>
      <div data-type="credit">{readable[1]}</div>
      <div data-type="amount">{sumOfAccountAndAmountList(debits).toReadable()}</div>
    </div>
  );
}

function stringifyAccountsAndAmounts(side) {
  const accountManager = global.accountManager;

  if (side.length === 0) { return '-'; }
  if (side.length === 1) {
    const { acc } = side[0];
    return accountManager.fromIdToName(acc);
  }

  const accountNames = side.map(({ acc }) => accountManager.fromIdToName(acc));

  return side.map(({ acc, amt }, index) =>
    <span key={String(index)}>
      {(index === 0 ? null : <br />)}
      <span>
        {accountNames[index] + ' – ' + amt.toReadable()}
      </span>
    </span>
  )
}
