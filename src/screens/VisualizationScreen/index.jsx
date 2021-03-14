import { Button, TextField } from '@material-ui/core';
import React from 'react';
import { connect } from '../../overmind';
import Section2 from './Section2'

import 'chartjs-plugin-colorschemes';

import { queryTableGetCollection } from '../../newCore/parser';

class VisualizationScreen extends React.Component {
  state = {
    accountIds: [114, 113, 112, 124, 122],
    time: '2021-01',
    transactions: [],
  }
  _transactionsGrouped = {};

  componentDidMount() {
    this.storage = this.props.overmind.effects.storage
    // this.setState({
    //   accountIds: this.storage.get('visualization', [])
    // })
    this.refresh();
  }

  refresh = async () => {
    const transactions = await queryTableGetCollection(
      global.transactionManager.table,
      `${this.state.time}`
    ).toArray();

    this._transactionsGrouped = {};
    for (let accountId of this.state.accountIds) {
      const trans = await queryTableGetCollection(transactions, `id(${accountId})`)
      this._transactionsGrouped[accountId] = trans
    }

    console.log(this._transactionsGrouped);
    this.setState({ transactions });
  }

  render() {
    return (
      <div>
        <TextField
          onChange={(e) => this.setState({ time: e.target.value })}
          onKeyPress={(e) => e.key === 'Enter' && this.refresh()}
        />
        <Button onClick={() => this.refresh()}>Update</Button>
        {
          this.state.accountIds.map(accountId =>
            <Section2 key={String(accountId)} accountId={accountId} transactions={this._transactionsGrouped[accountId]} />
          )
        }
        {/* <Bar
          data={data}
          options={options}
        /> */}

      </div>
    )
  }
}

export default connect(VisualizationScreen)

// const data = {
//   labels: ['January', 'February', 'March'],
//   datasets: [{
//     label: 'Dataset 1',
//     backgroundColor: [
//       'red',
//       'orange',
//       'blue',
//     ],
//     yAxisID: 'y-axis-1',
//     data: [
//       15, 30, 2
//     ]
//   }, {
//     label: 'Dataset 2',
//     backgroundColor: 'grey',
//     yAxisID: 'y-axis-2',
//     data: [
//       10, 20, 30
//     ]
//   }]
// }

// const options = {
//   responsive: true,
//   title: {
//     display: true,
//     text: 'Chart.js Bar Chart - Multi Axis'
//   },
//   tooltips: {
//     mode: 'index',
//     intersect: true
//   },
//   scales: {
//     yAxes: [{
//       type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
//       display: true,
//       position: 'left',
//       id: 'y-axis-1',
//     }, {
//       type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
//       display: true,
//       position: 'right',
//       id: 'y-axis-2',
//       gridLines: {
//         drawOnChartArea: false
//       }
//     }],
//   }
// }
