import React from 'react'
import { HorizontalBar } from 'react-chartjs-2'
import { TransactionList } from 'components'
import { BalanceAccumulator, getAccountColor, ColorStripSpan } from '_core/helpers'


export default class Section extends React.Component {

  componentDidMount() { this.transactionList.setData(this.props.transactions) }
  componentDidUpdate() {
    // TODO: using componentDidUpdate & componentDidMount is not a long term solution
    this.transactionList.setData(this.props.transactions)
  }

  get folderAccountDistributionChartData() {
    const childrenIds = global.accountManager.getChildrenIds(this.props.accountId)
    const ba = new BalanceAccumulator(this.props.transactions)

    const result = []

    // NOTE: Current implementation skips nested accounts
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

  get accountInOutChartData() {
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
      <div style={{ marginBlockEnd: 80 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <h2 style={{ width: '25%' }}>
            <ColorStripSpan account={this.account} />
            {this.account.name + (this.account.isFolder ? ' 📂' : ' 📄')}
          </h2>
          <div style={{ flex: 1 }}>
            {
              this.account.isFolder ?
                <ChartWrapper title='Distribution' chartData={this.folderAccountDistributionChartData} />
                :
                <ChartWrapper title='From/To' chartData={this.accountInOutChartData} />
            }
          </div>
        </div>
        <details open>
          <TransactionList
            ref={(ref) => this.transactionList = ref}
            height={310}
          />
        </details>
      </div>
    )
  }
}

function ChartWrapper({ chartData, title }) {
  return (
    <HorizontalBar
      height={30}
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
        title: {
          text: title,
          display: true,
          position: 'left',
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
              if (value > 1000)
                return label + ' ' + Math.round(value)
              else
                return label + '\n' + Math.round(value)
            },
          }
        },
      }}
    />
  )
}
