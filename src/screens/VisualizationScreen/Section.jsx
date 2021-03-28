import React from 'react'
import { HorizontalBar } from 'react-chartjs-2'
import { TransactionList } from 'components'
import { BalanceAccumulator, getAccountColor, ColorStripSpan } from '_core/helpers'


export default class Section extends React.PureComponent {
  componentDidMount() { this.componentDidUpdate() }
  componentDidUpdate() {
    // TODO: using componentDidUpdate & componentDidMount is not a long term solution
    if (this.transactionList)
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

  get totalAmountString() {
    return (
      new BalanceAccumulator(this.props.transactions)
        .getAccountBalance(this.props.accountId)
        .balance
        .toReadable()
    )
  }

  render() {
    const isFolder = this.account.isFolder ? true : null;
    const isEmpty = this.props.transactions.length === 0 ? true : null;
    const height = Math.min(260, this.props.transactions.length * 30 + 10)
    return (
      <details>
        <summary>
          <div style={{ marginBlockStart: isFolder ? 80 : 0, marginLeft: isFolder ? 0 : 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <h2 style={{ width: isFolder ? '25%' : '100%', opacity: isEmpty ? 0.4 : 1 }}>
                <ColorStripSpan account={this.account} />
                {this.account.name + (isFolder ? ' 📂' : ' 📄')}
                {` ${this.props.transactions.length} item` + (this.props.transactions.length === 1 ? '' : 's')}
                {!isFolder && (' -- ' + this.totalAmountString)}
              </h2>
              {
                isFolder &&
                <div style={{ flex: 1 }}>
                  {
                    isFolder ?
                      <ChartWrapper title='Distribution' chartData={this.folderAccountDistributionChartData} />
                      :
                      <ChartWrapper title='From/To' chartData={this.accountInOutChartData} />
                  }
                </div>
              }
            </div>
          </div>
        </summary>
        {
          !isEmpty && !isFolder &&
          <div style={{ height: height + 80 }}>
            <TransactionList
              ref={(ref) => this.transactionList = ref}
              height={height}
            />
          </div>
        }
      </details>
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
