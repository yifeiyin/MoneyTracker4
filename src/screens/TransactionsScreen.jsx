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

  componentDidMount() {
    this.execute();
  }

  render() {
    return (
      <div>
        <Button variant='outlined' color='primary' onClick={() => this.TransactionView.promptToCreate()}>Create New Transaction</Button>
        <div style={{ display: 'flex' }}>
          <Input fullWidth value={this.state.currentQuery} onChange={(e) => this.onChange(e.target.value)} />
          <Button variant='outlined' color='primary' onClick={() => this.execute()}>Execute</Button>
        </div>

        <TransactionList
          ref={(o) => this.TransactionView = o}
          enqueueSnackbar={this.props.enqueueSnackbar}
          height='calc(100vh - 300px)'
        />
      </div>
    );
  }
}

export default withSnackbar(TransactionsScreen);
