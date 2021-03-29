import React from 'react';

import { Modal } from '.';
import { Typography, IconButton, Checkbox, Button } from '@material-ui/core'
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';

import ObjectEditor from '../ObjectEditor/index';
import { TransactionCreateFormat, TransactionEditFormat } from '../ObjectEditor/ObjectFormats';
import { deepCopy, getTodaysDateAt0000, sumOfAccountAndAmountList, formatDate, ColorStripSpan } from '_core/helpers';
import { queryTableGetCollection } from '_core/transactionQueryParser';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

/*
This component has 3 important tasks

Data Fetching
  - Query parsing
  - Retrieving
  - Paging (needs to be redone: remove incremental retrieving)
  - Nice to have: preset filters

Display
  - Format data for display
  - Need to have a better display format

Actions
  - Create (modal form)
  - Edit (modal form)
  - Delete
  - Select/Deselect (currently does nothing)
  - Nice to have: edit some fields without opening the model
*/


export default class TransactionView extends React.Component {
  state = {
    data: [],
    currentTransactionId: null,
    currentTransactionValue: {},
    error: null,
    selectedTransactionMap: {},
    shouldShowReverse: false,
  }

  collection = null;
  queryTime = null;

  get selectedTransactionIds() {
    return Object.entries(this.state.selectedTransactionMap).filter(([k, v]) => v).map(([k, v]) => Number(k))
  }

  componentDidMount() {
    if (this.props.initialQuery)
      this.setQuery(this.props.initialQuery);
  }

  setQuery = async (query) => {
    try {
      this.collection = queryTableGetCollection(global.transactionManager.table, query);
      if (this.collection.toCollection) this.collection = this.collection.toCollection();

    } catch (error) {
      this.setState({ error: error.message });
      return;
    }

    await this.loadData();
  }

  setData = (transactions) => {
    this.setState({ data: transactions });
  }

  loadData = async () => {
    const startTime = new Date();
    try {
      let data = await this.collection.clone().sortBy('time');
      // NOTE: 'account relates' query returns duplicated entries.
      //       Removing the duplicates by id here.
      let uniqueData = [];
      for (let transaction of data)
        if (!uniqueData.map(trans => trans.id).includes(transaction.id))
          uniqueData.push(transaction);

      this.queryTime = new Date() - startTime;
      this.setState({ data: uniqueData, error: null });

    } catch (error) {
      this.setState({ error: 'Query runtime error: ' + error.message });
    }
  }


  InformationLine = () => {
    if (this.state.error)
      return (
        <Typography color='error'>
          {this.state.error}
        </Typography>
      )

    const selectedCount = this.selectedTransactionIds.length;

    return (
      <div style={{ display: 'flex', margin: '10px' }}>
        <Typography color='textPrimary' style={{ width: '100px', marginRight: '25px' }}>
          {selectedCount === 0 ? '' : selectedCount + ' selected'}
        </Typography>
        <Typography color='textSecondary' style={{ width: '100px', marginRight: '25px' }}>
          {this.state.data.length + ' item' + (this.state.data.length === 1 ? '' : 's')}
        </Typography>
        <Typography color='textSecondary' style={{ width: '120px', marginRight: '25px' }}>
          {this.queryTime && ('took ' + this.queryTime + ' ms')}
        </Typography>
        <Button size="small" variant="outlined" onClick={() => this.reverseList()}>
          {
            this.state.shouldShowReverse ?
              <><ArrowUpwardIcon />Recent First</>
              :
              <><ArrowDownwardIcon />Chronological</>
          }
        </Button>
        <Button size="small" variant="outlined" onClick={() => this.selectAll()}>
          Select All
        </Button>
        <Button size="small" variant="outlined" onClick={() => this.deselectAll()}>
          Deselect All
        </Button>
        <Button size="small" variant="outlined" onClick={() => this.removeSelected()}>
          <DeleteIcon size="small" />
          Remove
        </Button>
      </div>
    )
  }

  reverseList = () => {
    this.setState({ shouldShowReverse: !this.state.shouldShowReverse });
  }

  selectAll = async () => {
    const ids = await this.collection.clone().primaryKeys();
    const map = {};
    ids.forEach((id) => map[id] = true);
    this.setState({ selectedTransactionMap: map });
  }
  deselectAll = () => { this.setState({ selectedTransactionMap: {} }); }
  removeSelected = async () => {
    if (!global.confirm(`Are you sure to delete ${this.selectedTransactionIds.length} transaction(s)?`))
      return;

    for (let id of this.selectedTransactionIds)
      try {
        await global.transactionManager.remove(id);
      } catch (error) { return alert(error); }

    this.props.enqueueSnackbar('Deleted!', { variant: 'success' });
    this.loadData();
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

    try {
      if (id === 'new')
        await global.transactionManager.create(newValue);
      else
        await global.transactionManager.update(id, newValue);
    } catch (error) { alert(error); return; }

    this.props.enqueueSnackbar('Done', { variant: 'success' });
    this.closeModal();
    this.loadData();
  }


  isTransactionSelectedById(id) { return this.state.selectedTransactionMap[id]; }
  onChangeSelect = (id, newValue) => {
    if (newValue) this.setState({ selectedTransactionMap: { ...this.state.selectedTransactionMap, [id]: true } })
    else this.setState({ selectedTransactionMap: { ...this.state.selectedTransactionMap, [id]: false } })
  }

  render() {
    return (
      <div style={{ padding: 5, display: 'flex', flexDirection: 'column', height: this.props.height ?? 280 }}>
        <Modal open={this.state.currentTransactionId !== null} onModalRequestClose={() => this.onSaveTransaction(true)}>
          <ObjectEditor
            format={this.state.currentTransactionId === 'new' ? TransactionCreateFormat : TransactionEditFormat}
            values={this.state.currentTransactionValue}
            onChange={(currentTransactionValue) => this.setState({ currentTransactionValue })}
            onSave={this.onSaveTransaction}
          />
        </Modal>
        <this.InformationLine />
        <AutoSizer style={{ flex: 1 }}>
          {
            ({ height, width }) =>
              <List
                height={height}
                width={width}
                itemCount={this.state.data.length}
                itemKey={(index) => String(this.state.data[index].id)}
                itemSize={30}
                overscanCount={10}
              >
                {({ index, style }) => {
                  let transaction;
                  if (this.state.shouldShowReverse)
                    transaction = this.state.data[this.state.data.length - index - 1];
                  else
                    transaction = this.state.data[index];
                  const id = transaction.id;

                  return (
                    <div className={'transaction-row' + (index % 2 ? ' even' : '')} style={style}>
                      <TransactionTableBodyCells
                        isSelected={this.isTransactionSelectedById(id)}
                        onChangeSelect={(newValue) => this.onChangeSelect(id, newValue)}
                        onEdit={() => this.onEdit(transaction)}
                        transaction={transaction}
                      />
                    </div>
                  )
                }}
              </List>
          }
        </AutoSizer>
      </div>
    );
  }
}

function TransactionTableBodyCells({ transaction, onEdit, isSelected, onChangeSelect }) {
  const { id, time, title, debits, credits } = transaction;
  const readable = [stringifyAccountsAndAmounts(debits), stringifyAccountsAndAmounts(credits)]

  return (
    <>
      <Checkbox checked={isSelected} onChange={(e) => onChangeSelect(e.target.checked)} />
      <IconButton size='small' onClick={onEdit}><EditIcon /></IconButton>
      <div data-type="id" style={{ color: 'gray', fontSize: '50%' }}>{id}</div>
      <div data-type="time">{formatDate(time, false)}</div>
      <div data-type="title">{title}</div>
      <div data-type="debit">{readable[0]}</div>
      <div data-type="credit">{readable[1]}</div>
      <div data-type="amount">{sumOfAccountAndAmountList(debits).toReadable()}</div>
    </>
  );
}


function stringifyAccountsAndAmounts(side) {
  const accountManager = global.accountManager;
  if (side.length === 0) { return '-'; }
  if (side.length === 1) {
    const { acc } = side[0];
    return <span><ColorStripSpan id={acc} />{accountManager.fromIdToName(acc)}</span>;
  }
  const accountNames = side.map(({ acc }) => accountManager.fromIdToName(acc));
  return side.map(({ acc, amt }, index) =>
    <span key={String(index)}>
      {(index === 0 ? null : <br />)}
      <span>
        <ColorStripSpan id={acc} />
        {accountNames[index] + ' – ' + amt.toReadable()}
      </span>
    </span>
  )
}
