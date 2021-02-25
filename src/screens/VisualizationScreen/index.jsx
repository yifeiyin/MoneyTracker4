import React from 'react';
import Section from './Section'

export default class VisualizationScreen extends React.Component {

  state = {
    transactions: [],
  }

  componentDidMount() {

  }

  render() {
    return <div>

      <Section />
      {/* <TransactionTableSimplified transactions={this.state.transactions} /> */}

    </div>
  }
}

