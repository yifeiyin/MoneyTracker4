import React, { useEffect } from 'react';

import { Modal } from '.';
import ObjectEditor from '../ObjectEditor/index';
import { TransactionCreateFormat, TransactionEditFormat } from '../ObjectEditor/ObjectFormats';
import { deepCopy, getTodaysDateAt0000, sumOfAccountAndAmountList, formatDate } from '../newCore/helpers';
import { FixedSizeList as List } from 'react-window';
// import AutoSizer from 'react-virtualized-auto-sizer';


export default class TransactionView extends React.Component {
  state = {
    data: [],
    currentTransactionId: null,
    currentTransactionValue: {},
  }

  componentDidMount() {
    this.reloadData();
  }

  reloadData = async () => {
    const data = await this.props.loadData().toArray();
    this.setState({ data });
  }

  promptToCreate = (defaultValues = {}) => {
    defaultValues.time = getTodaysDateAt0000();
    this.setState({
      currentTransactionId: 'new',
      currentTransactionValue: defaultValues,
    });
  }

  onEdit = (data) => {
    this.setState({
      currentTransactionId: data.id,
      currentTransactionValue: deepCopy(data),
    });
  }

  closeModal = () => {
    this.setState({
      currentTransactionId: null,
      currentTransactionValue: {},
    });
  }

  onSaveTransaction = async (aborting) => {
    if (aborting) return this.closeModal();

    const newValue = deepCopy(this.state.currentTransactionValue);
    delete newValue.id;
    const id = this.state.currentTransactionId;

    let success = false;
    if (id === 'new') {
      try {
        await global.transactionManager.create(newValue);
        success = true;

      } catch (error) { alert(error) }

    } else {
      try {
        await global.transactionManager.update(id, newValue);
        success = true;

      } catch (error) { alert(error) }
    }

    if (success) {
      this.props.enqueueSnackbar('Done', { variant: 'success' });
      this.closeModal();
      this.reloadData();
    }
  }

  onRemove = async (id) => {
    let success = false;
    try {
      await global.transactionManager.remove(id);
      success = true;
    } catch (error) { alert(error) }

    if (success) {
      this.props.enqueueSnackbar('Deleted!', { variant: 'success' });
      this.reloadData();
    }
  }

  render() {
    return (
      <div style={{ padding: 5 }}>
        <Modal open={this.state.currentTransactionId !== null} onModalRequestClose={() => this.onSaveTransaction(true)}>
          <ObjectEditor
            format={this.state.currentTransactionId === 'new' ? TransactionCreateFormat : TransactionEditFormat}
            values={this.state.currentTransactionValue}
            onChange={(currentTransactionValue) => this.setState({ currentTransactionValue })}
            onSave={this.onSaveTransaction}
          />
        </Modal>

        <List
          height={800}
          width={1300}
          itemCount={this.state.data.length}
          itemSize={50}
        >
          {({ index, style }) => (
            <div className={'transaction-row' + (index % 2 ? ' even' : '')} style={style}>
              <TransactionTableBodyCells transaction={this.state.data[index]} />
            </div>
          )}
        </List>
      </div>
    );
  }
}


function TransactionTableBodyCells({ transaction }) {
  const { id, time, title, debits, credits } = transaction;

  const [readable, setReadable] = React.useState(['loading', 'loading']);

  useEffect(() => {
    Promise.all([
      stringifyAccountsAndAmounts(debits),
      stringifyAccountsAndAmounts(credits)
    ]).then(setReadable);
  }, [debits, credits]);

  return (
    <>
      <div data-type="id">{id}</div>
      <div data-type="date">{formatDate(time, false)}</div>
      <div data-type="title">{title}</div>
      <div data-type="debit">{readable[0]}</div>
      <div data-type="credit">{readable[1]}</div>
      <div data-type="amount">{sumOfAccountAndAmountList(debits).toReadable()}</div>
    </>
  );
}


async function stringifyAccountsAndAmounts(side) {
  const accountManager = global.accountManager;

  if (side.length === 0) { return ''; }
  if (side.length === 1) {
    const { acc } = side[0];
    return await accountManager.fromIdToName(acc);
  }

  const accountNames = await Promise.all(side.map(({ acc }) => accountManager.fromIdToName(acc)));

  return side.map(({ acc, amt }, index) =>
    <span key={String(index)}>
      {(index === 0 ? null : <br />)}
      <span>
        {accountNames[index] + ' – ' + amt.toReadable()}
      </span>
    </span>
  )
}
