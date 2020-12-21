import React from 'react';
import { Button } from '@material-ui/core';
import { TransactionList } from '../components';
import { withSnackbar } from 'notistack';

class TransactionsScreen extends React.Component {
  TransactionView = null;

  componentDidMount() {
    this.reloadData();
  }

  reloadData = () => {
    global.transactionContainer.getAll().then(this.TransactionView.setData)
  }

  onCreateSave = (newValue) => {
    try {
      global.transactionManager.create(newValue);
      this.props.enqueueSnackbar('Created!', { variant: 'success' });

    } catch (error) {
      alert(error);
      return false;
    }

    this.reloadData();
    return true;
  }

  onEditSave = (id, newValue) => {
    try {
      global.transactionManager.update(id, newValue);
      this.props.enqueueSnackbar('Updated!', { variant: 'success' });

    } catch (error) {
      alert(error);
      return false;
    }

    this.reloadData();
    return true;
  }

  onRemove = (id) => {
    try {
      global.transactionManager.remove(id);
      this.props.enqueueSnackbar('Removed!', { variant: 'success' });
    } catch (error) {
      alert(error);
    }

    this.reloadData();
  }

  render() {
    return (
      <div>
        <Button variant='outlined' color='primary' onClick={() => this.TransactionView.promptToCreate()}>Create New Transaction</Button>
        <TransactionList
          ref={(o) => this.TransactionView = o}
          viewOnly={false}
          onEditSave={this.onEditSave}
          onCreateSave={this.onCreateSave}
          onRemove={this.onRemove}
        />
      </div>
    );
  }
}

export default withSnackbar(TransactionsScreen);
