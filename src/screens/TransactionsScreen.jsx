import React from 'react';
import { Button, Input } from '@material-ui/core';
import { TransactionList } from '../components';
import { withSnackbar } from 'notistack';

class TransactionsScreen extends React.Component {
  TransactionView = null;

  state = {
    currentQuery: '',
  }

  timeout = null;
  onChange = (currentQuery) => {
    this.setState({ currentQuery }, () => {
      if (this.timeout) clearTimeout(this.timeout);
      this.timeout = setTimeout(() => this.execute(), 200)
    });
  }

  execute = () => {
    this.TransactionView.setQuery(this.state.currentQuery);
  }

  render() {
    return (
      <div>
        <Button variant='outlined' color='primary' onClick={() => this.TransactionView.promptToCreate()}>Create New Transaction</Button>
        <div></div>
        <Input fullWidth value={this.state.currentQuery} onChange={(e) => this.onChange(e.target.value)} />
        <Button variant='outlined' color='primary' onClick={() => this.execute()}>Execute</Button>

        <TransactionList
          ref={(o) => this.TransactionView = o}
          enqueueSnackbar={this.props.enqueueSnackbar}
          viewOnly={false}
        />
      </div>
    );
  }
}

export default withSnackbar(TransactionsScreen);
