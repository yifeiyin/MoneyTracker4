import React from 'react';

import { Modal } from '.';
import { Typography, IconButton, Checkbox, Button } from '@material-ui/core'
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';

import ObjectEditor from '../ObjectEditor/index';
import { TransactionCreateFormat, TransactionEditFormat } from '../ObjectEditor/ObjectFormats';
import { deepCopy, getTodaysDateAt0000, sumOfAccountAndAmountList, formatDate } from '_core/helpers';
import { queryTableGetCollection } from '_core/transactionQueryParser';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

const PAGE_LIMIT = 80;

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
    totalCount: 0,
    currentPage: 0,
    currentTransactionId: null,
    currentTransactionValue: {},
    error: null,
    selectedTransactionMap: {},
  }

  collection = null;
  queryTime = null;

  componentDidMount() {
    this.setQuery(this.props.initialQuery || '');
  }

  setQuery = async (query) => {
    try {
      this.collection = queryTableGetCollection(global.transactionManager.table, query);
      if (this.collection.toCollection) this.collection = this.collection.toCollection();

    } catch (error) {
      this.setState({ error: error.message });
      return;
    }

    await this.loadDataAtPage(0);
  }

  loadDataAtPage = async (currentPage) => {
    const offset = currentPage * PAGE_LIMIT;
    const startTime = new Date();
    try {
      const totalCount = await this.collection.clone().count();
      const data = await this.collection.clone().offset(offset).limit(PAGE_LIMIT).sortBy('time');

      this.queryTime = new Date() - startTime;
      this.setState({ data, currentPage, totalCount, error: null });

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

    const { totalCount, currentPage, data } = this.state;
    let pageText = totalCount + ' item' + (totalCount === 1 ? '' : 's');
    if (totalCount > PAGE_LIMIT) {
      pageText = `${currentPage * PAGE_LIMIT + 1} - ${currentPage * PAGE_LIMIT + data.length} / ${pageText}`;
    }

    const selectedCount = Object.values(this.state.selectedTransactionMap).filter(Boolean).length;

    return (
      <div style={{ display: 'flex', margin: '10px' }}>
        <Typography color='textPrimary' style={{ width: '160px', marginRight: '25px' }}>
          {pageText}
        </Typography>
        <Typography color='textPrimary' style={{ width: '100px', marginRight: '25px' }}>
          {selectedCount === 0 ? '' : selectedCount + ' selected'}
        </Typography>
        <Typography color='textSecondary' style={{ width: '120px', marginRight: '25px' }}>
          {'took ' + this.queryTime + ' ms'}
        </Typography>
        {
          Array.from({ length: Math.ceil((totalCount - 1) / PAGE_LIMIT) }).map((v, index) =>
            <Button
              key={String(index)}
              size="small"
              variant={(index === currentPage) ? "outlined" : "text"}
              onClick={() => this.loadDataAtPage(index)}
            >
              {index + 1}
            </Button>
          )
        }
      </div>
    )
  }

  selectAll = async () => {
    const ids = await this.collection.clone().primaryKeys();
    const map = {};
    ids.forEach((id) => map[id] = true);
    this.setState({ selectedTransactionMap: map });
  }
  deselectAll = () => { this.setState({ selectedTransactionMap: {} }); }

  ToolBar = () => {
    return (
      <div style={{ display: 'flex', margin: '10px' }}>
        <Button variant="outlined" onClick={() => this.selectAll()}>
          Select All
        </Button>
        <Button variant="outlined" onClick={() => this.deselectAll()}>
          Deselect All
        </Button>
      </div>
    )
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
      if (id === 'new') {
        await global.transactionManager.create(newValue);
      } else {
        await global.transactionManager.update(id, newValue);
      }
    } catch (error) { alert(error); return; }

    this.props.enqueueSnackbar('Done', { variant: 'success' });
    this.closeModal();
    this.loadDataAtPage(this.state.currentPage);
  }

  onRemove = async (id) => {
    try {
      await global.transactionManager.remove(id);
    } catch (error) { alert(error); return; }

    this.props.enqueueSnackbar('Deleted!', { variant: 'success' });
    this.loadDataAtPage(this.state.currentPage);
  }

  isTransactionSelectedById(id) { return this.state.selectedTransactionMap[id]; }
  onChangeSelect = (id, newValue) => {
    if (newValue) this.setState({ selectedTransactionMap: { ...this.state.selectedTransactionMap, [id]: true } })
    else this.setState({ selectedTransactionMap: { ...this.state.selectedTransactionMap, [id]: false } })
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
        <this.InformationLine />
        <this.ToolBar />
        <AutoSizer style={{ height: 'calc(100vh - 360px)' }}>
          {
            ({ height, width }) =>
              <List
                height={height}
                width={width}
                itemCount={this.state.data.length}
                itemKey={(index) => String(this.state.data[index].id)}
                itemSize={50}
              >
                {({ index, style }) => {
                  const transaction = this.state.data[index];
                  const id = transaction.id;

                  return (
                    <div className={'transaction-row' + (index % 2 ? ' even' : '')} style={style}>
                      <TransactionTableBodyCells
                        isSelected={this.isTransactionSelectedById(id)}
                        onChangeSelect={(newValue) => this.onChangeSelect(id, newValue)}
                        onEdit={() => this.onEdit(transaction)}
                        onRemove={() => this.onRemove(id)}
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

function TransactionTableBodyCells({ transaction, onEdit, onRemove, isSelected, onChangeSelect }) {
  const { id, time, title, debits, credits } = transaction;
  const readable = [stringifyAccountsAndAmounts(debits), stringifyAccountsAndAmounts(credits)]

  return (
    <>
      <Checkbox checked={isSelected} onChange={(e) => onChangeSelect(e.target.checked)} />
      <IconButton size='small' onClick={onEdit}><EditIcon /></IconButton>
      <IconButton size='small' onClick={onRemove}><DeleteIcon /></IconButton>
      <div data-type="id">{id}</div>
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
