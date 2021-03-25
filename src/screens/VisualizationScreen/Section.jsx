import React from 'react'
import { HorizontalBar } from 'react-chartjs-2'
import { BalanceAccumulator, getAccountColor } from '_core/helpers'


export default class Section extends React.Component {

  get chartData() {
    const childrenIds = global.accountManager.getChildrenIds(this.props.accountId)
    const ba = new BalanceAccumulator(this.props.transactions)

    const result = []

    for (let childrenId of childrenIds) {
      result.push({
        label: global.accountManager.get(childrenId).name,
        backgroundColor: getAccountColor(childrenId),
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
        backgroundColor: getAccountColor(childrenId),
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
        <h2>
          <span style={{ backgroundColor: getAccountColor(this.account) }}>&nbsp;&nbsp;</span>&nbsp;
          {this.account.name + (this.account.isFolder ? ' 📂' : ' 📄')}
        </h2>
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
      height={25}
      data={{
        labels: ['CR', 'DR'],
        datasets: chartData,
      }}
      options={{
        tooltips: {
          mode: 'point',
          intersect: false,
        },
        scales: {
          xAxes: [{
            stacked: true,
            ticks: {
              suggestedMin: 0,
              suggestedMax: 3000,
              stepSize: 500,
            }
          }],
          yAxes: [{
            stacked: true,
          }],
        },
        legend: {
          display: false,
        },
        plugins: {
          datalabels: {
            textAlign: 'center',
            color: ({ dataIndex, dataset }) => {
              if (dataset.data[dataIndex] === 0)
                return 'transparent'
              else
                return 'black'
            },
            formatter(value, context) {
              console.log(context.chart.data);
              let label = context.chart.data.datasets[context.datasetIndex].label;
              label = label
                // Temporarily shortening account names
                .replace('Other Income/Expense', 'Other')
                .replace(' Expense', '')
                .replace(' Income', '')
                .replace('Subscription', 'Sub')
                .replace('Banking Fee', 'Bank')
                .replace('BMO Chequing', 'Cheq')
                .replace('BMO MasterCard', 'MC')
                .replace('Telecom', 'Tel')
              return label + '\n' + Math.round(value)
            },
          }
        },
      }}
    />
  )
}
