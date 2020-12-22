import React, { useEffect } from 'react';
import { Paper, TableContainer, Table, TableHead, TableBody, TableRow, TableCell, IconButton } from '@material-ui/core';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@material-ui/icons'

import { Modal } from '.';
import ObjectEditor from '../ObjectEditor/index';

import { TransactionCreateFormat, TransactionEditFormat } from '../ObjectEditor/ObjectFormats';

import { deepCopy, getTodaysDateAt0000, sumOfAccountAndAmountList, formatDate } from '../newCore/helpers'

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

        <Paper>
          <TableContainer>
            <Table size='medium'>
              <TableHead>
                <TableRow>
                  <TableCell key='actions'>Actions</TableCell>
                  <TransactionTableHeaderCells />
                </TableRow>
              </TableHead>

              <TableBody>
                {
                  this.state.data.map(data =>
                    <TableRow
                      hover
                      // onClick={(event) => handleClick(event, row.name)}
                      key={data.id}
                    >
                      <TableCell padding='checkbox'>
                        <IconButton size='small' onClick={() => this.onEdit(data)}><EditIcon color="inherit" /></IconButton>
                        <IconButton size='small' onClick={() => this.onRemove(data.id)}><DeleteIcon color="inherit" /></IconButton>
                      </TableCell>

                      <TransactionTableBodyCells transaction={data} />
                    </TableRow>
                  )
                }
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </div>
    );
  }
}

function TransactionTableHeaderCells() {
  return [
    'Id', 'Time', 'Title', 'Debits', 'Credits', 'Total Amount'
  ].map(key => <TableCell key={key}>{key}</TableCell>)
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
      <TableCell>{id}</TableCell>
      <TableCell>{formatDate(time, false)}</TableCell>
      <TableCell>{title}</TableCell>
      <TableCell>{readable[0]}</TableCell>
      <TableCell>{readable[1]}</TableCell>
      <TableCell>{sumOfAccountAndAmountList(debits).toReadable()}</TableCell>
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


