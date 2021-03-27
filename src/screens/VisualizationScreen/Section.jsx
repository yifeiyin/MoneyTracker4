import React from 'react'
import { HorizontalBar } from 'react-chartjs-2'
import { BalanceAccumulator, getAccountColor, formatDate, sumOfAccountAndAmountList, ColorStripSpan } from '_core/helpers'


export default class Section extends React.Component {

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
          <summary>{this.props.transactions.length + ' transaction(s)'}</summary>
          <TransactionTableSimplified transactions={this.props.transactions} />
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

function TransactionTableSimplified({ transactions }) {
  return transactions.map((transaction, index) =>
    <TransactionTableBodyCells key={transaction.id} transaction={transaction} isEvenRow={(index + 1) % 2} />
  )
}
function TransactionTableBodyCells({ transaction, isEvenRow }) {
  const { id, time, title, debits, credits } = transaction;
  const readable = [stringifyAccountsAndAmounts(debits), stringifyAccountsAndAmounts(credits)]
  return (
    <div className={`transaction-row ${isEvenRow ? 'even' : ''}`}>
      <div data-type="id">{id}</div>
      <div data-type="time">{formatDate(time, false)}</div>
      <div data-type="title">{title}</div>
      <div data-type="debit">{readable[0]}</div>
      <div data-type="credit">{readable[1]}</div>
      <div data-type="amount">{sumOfAccountAndAmountList(debits).toReadable()}</div>
    </div>
  );
}
function stringifyAccountsAndAmounts(side) {
  const accountManager = global.accountManager;
  if (side.length === 0) { return '-'; }
  if (side.length === 1) {
    const { acc } = side[0];
    return <span><ColorStripSpan id={acc} />{accountManager.fromIdToName(acc)}</span>;
  }
  const accountNames = side.map(({ acc }) => accountManager.fromIdToName(acc));
  return side.map(({ acc, amt }, index) =>
    <span key={String(index)}>
      {(index === 0 ? null : <br />)}
      <span>
        <ColorStripSpan id={acc} />
        {accountNames[index] + ' – ' + amt.toReadable()}
      </span>
    </span>
  )
}
