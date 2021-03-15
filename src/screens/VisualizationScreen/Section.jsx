import React from 'react'
import { HorizontalBar } from 'react-chartjs-2'
import { BalanceAccumulator } from '_core/helpers'


export default class Section extends React.Component {

  get chartData() {
    const childrenIds = global.accountManager.getChildrenIds(this.props.accountId)
    const ba = new BalanceAccumulator(this.props.transactions)

    const result = []

    for (let childrenId of childrenIds) {
      result.push({
        label: global.accountManager.get(childrenId).name,
        data: [
          ba.getAccountCredits(childrenId).castToNumberInCurrency('CAD'),
          ba.getAccountDebits(childrenId).castToNumberInCurrency('CAD'),
        ]
      })
    }

    return result
  }

  get chartData2() {
    const ba = new BalanceAccumulator(this.props.transactions)

    const result = []

    // TODO: Temporary solution
    for (let childrenId of new Set(ba.internal.map(({ accountId }) => accountId))) {
      if (childrenId === this.props.accountId) continue;
      result.push({
        label: global.accountManager.get(childrenId).name,
        backgroundColor: 'grey',
        data: [
          ba.getAccountCredits(childrenId).castToNumberInCurrency('CAD'),
          ba.getAccountDebits(childrenId).castToNumberInCurrency('CAD'),
        ]
      })
    }

    return result
  }

  get account() {
    return global.accountManager.get(this.props.accountId)
  }

  render() {
    return (
      <div>
        <h2>{this.account.name}</h2>
        {
          this.account.isFolder ? <ChartWrapper chartData={this.chartData} /> : <ChartWrapper chartData={this.chartData2} />
        }
      </div>
    )
  }
}

function ChartWrapper({ chartData }) {
  return (
    <HorizontalBar
      data={{
        labels: ['CR', 'DR'],
        datasets: chartData,
      }}
      options={{
        tooltips: {
          mode: 'point',
          intersect: false
        },
        scales: {
          xAxes: [{
            stacked: true,
            ticks: {
              suggestedMin: 0,
              suggestedMax: 3000,
              stepSize: 100,
            }
          }],
          yAxes: [{
            stacked: true,
          }],
        }
      }}
    />

  )
}
