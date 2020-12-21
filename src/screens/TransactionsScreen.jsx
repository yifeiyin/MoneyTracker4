import React from 'react';
import { Button } from '@material-ui/core';
import { TransactionList } from '../components';
import { withSnackbar } from 'notistack';

class TransactionsScreen extends React.Component {
  TransactionView = null;


  render() {
    return (
      <div>
        <Button variant='outlined' color='primary' onClick={() => this.TransactionView.promptToCreate()}>Create New Transaction</Button>
        <TransactionList
          ref={(o) => this.TransactionView = o}
          enqueueSnackbar={this.props.enqueueSnackbar}
          viewOnly={false}
          loadData={async () => global.transactionManager.getAll()}
        />
      </div>
    );
  }
}

export default withSnackbar(TransactionsScreen);
