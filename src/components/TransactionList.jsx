import React from 'react';
import { Paper, TableContainer, Table, TableHead, TableBody, TableRow, TableCell, IconButton } from '@material-ui/core';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@material-ui/icons'

import { Modal } from '.';
import ObjectEditor from '../ObjectEditor/index';

import { TransactionCreateFormat, TransactionEditFormat } from '../ObjectEditor/ObjectFormats';

/**
 * Methods
 *  - setData
 *  - promptToCreate
 *  - closeModal
 *
 * Props
 *  - viewOnly: boolean
 *  - onCreateSave: (newTransactionValues) => shouldModalClose
 *  - onEditSave: (targetId, newTransactionValues) => shouldModalClose
 *  - onRemove: (targetId) => undefined
 *
 * Note
 *  - The caller should setData after onCreateSave, onEditSave or onRemove
 */
export default class TransactionView extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      data: [],
      currentTransactionId: null,
      currentTransactionValue: {},
    }
  }

  promptToCreate = (defaultValues = {}) => {
    this.setState({
      currentTransactionId: 'new',
      currentTransactionValue: defaultValues,
    });
  }

  setData = (newData) => {
    if (!(newData instanceof Array)) {
      newData = Object.keys(newData).map(id => ({ id, ...newData[id] }));
    }

    // Sort by transaction time
    newData.sort((a, b) => a.time - b.time);

    this.setState({ data: newData });
  }

  onEdit = (data) => {
    this.setState({
      currentTransactionId: data.id,
      currentTransactionValue: global.deepCopy(data),
    });
  }

  closeModal = () => {
    this.setState({
      currentTransactionId: null,
      currentTransactionValue: {},
    });
  }

  onSaveTransaction = (aborting) => {
    if (aborting) return this.closeModal();

    const newValue = global.deepCopy(this.state.currentTransactionValue);
    delete newValue.id;
    const id = this.state.currentTransactionId;

    let shouldModalClose;
    if (id === 'new') {
      shouldModalClose = this.props.onCreateSave(newValue);
    } else {
      shouldModalClose = this.props.onEditSave(id, newValue);
    }

    if (shouldModalClose) this.closeModal();
  }

  onRemove = (id) => {
    this.props.onRemove(id);
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
            <Table size='medium' >
              <TableHead>
                <TableRow>
                  <TableCell key='actions'>Actions</TableCell>
                  {
                    generateTransactionTableCells().map(key =>
                      <TableCell key={key}>{key}</TableCell>
                    )
                  }
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

                      {
                        generateTransactionTableCells(data)
                      }
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

function generateTransactionTableCells(t) {

  if (!t) {
    return [
      'Id', 'Time', 'Title', 'Debits', 'Credits', 'Total Amount'
    ];
  }

  return (
    <>
      <TableCell>{t.id}</TableCell>
      <TableCell>{formatDate(t.time, false)}</TableCell>
      <TableCell>{t.title}</TableCell>
      <TableCell>{stringifyAccountsAndAmounts(t.debits)}</TableCell>
      <TableCell>{stringifyAccountsAndAmounts(t.credits)}</TableCell>
      <TableCell>{calculateAmount(t).toString()}</TableCell>
    </>
  );
}


function stringifyAccountsAndAmounts(oneSide) {
  const accountManager = global.accountManager;

  if (oneSide.length === 0) { return ''; }
  if (oneSide.length === 1) {
    const [targetAccountId] = oneSide[0];
    return accountManager.fromIdToName(targetAccountId);
  }

  return oneSide.map(([targetAccountId, monum], index) =>
    <span key={String(index)}>{(index === 0 ? null : <br />)}<span>{accountManager.fromIdToName(targetAccountId) + ' – ' + monum.toString()}</span></span>
  )
}


function calculateAmount(transaction) {  // 计算发生额
  const Monum = global.Monum;
  let debitTotal = new Monum();
  let creditTotal = new Monum();

  if (!(transaction.debits instanceof Array))
    throw new Error('Transaction does not have debits as Array');
  if (!(transaction.credits instanceof Array))
    throw new Error('Transaction does not have credits as Array');

  debitTotal = debitTotal.add(...transaction.debits.map(v => v[1]));
  creditTotal = creditTotal.add(...transaction.credits.map(v => v[1]));
  if (debitTotal.sub(creditTotal).isNotZero())
    console.log('!!!WARNING: when calculating two side values, they does not seem to be the same.\n' +
      'debit side total is ' + debitTotal.toString() + '\n' +
      'credit side total is ' + creditTotal.toString() + '\n' +
      '---- end of warning ----\n');             // We don't really throw an error, don't want to interrupt the program

  return debitTotal; // Returning debit total
}


function formatDate(date, withTimezone = true) {
  return (
    `${date.getFullYear()}-${TwoDigitPad(date.getMonth() + 1)}-${TwoDigitPad(date.getDate())}` + ' ' +
    `${TwoDigitPad(date.getHours())}:${TwoDigitPad(date.getMinutes())}` + (date.getSeconds() == 0 ? '' : `:${TwoDigitPad(date.getSeconds())}`) +
    (withTimezone ? date.toString().substr(date.toString().indexOf('GMT')) : '')
  );

  function TwoDigitPad(s) {
    return s < 10 ? '0' + s : s;
  }
}
