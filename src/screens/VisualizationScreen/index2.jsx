import { Button, IconButton, TextField } from '@material-ui/core';
import { Add, Delete } from '@material-ui/icons';
import React from 'react';
import { connect } from '../../overmind';
import Section from './Section'

import { Pie } from 'react-chartjs-2'
import 'chartjs-plugin-colorschemes';

class VisualizationScreen extends React.Component {
  state = {
    accountIds: [],
    time: '2021-01',
  }

  sectionRefs = []
  chartData = []

  componentDidMount() {
    this.storage = this.props.overmind.effects.storage
    this.setState({
      accountIds: this.storage.get('visualization', [])
    })
  }

  onRemove = (index) => {
    const copy = this.state.accountIds.filter((_, i) => i !== index);
    this.setState({ accountIds: copy });
    this.storage.set('visualization', copy.filter(Boolean));
  }

  onChange = (index, accountId) => {
    const copy = [...this.state.accountIds];
    copy[index] = accountId;
    this.setState({ accountIds: copy });
    this.storage.set('visualization', copy.filter(Boolean));
  }

  addNew = () => {
    this.onChange(this.state.accountIds.length, 0)
  }

  refresh = () => {
    Object.values(this.sectionRefs).forEach(ref => {
      ref.refresh();
    })
  }

  updateData = (index, data) => {
    this.chartData[index] = data;
  }

  get realChartData() {
    const { chartData } = this.state;

    if (!chartData) {
      return {
        labels: ['1', '2', '3'],
        datasets: [{ data: [1, 2, 3] }],
      }
    }

    return {
      labels: chartData.map(data => data.label),
      datasets: [{ data: chartData.map(data => data.value) }],
    }
  }

  render() {
    return (
      <div>
        <TextField
          onChange={(e) => this.setState({ time: e.target.value })}
          onKeyPress={(e) => e.key === 'Enter' && this.refresh()}
        />
        <Button onClick={() => this.refresh()}>Update</Button>
        {this.state.accountIds.map((accountId, index) => (
          <div key={`${accountId} ${index}`}>
            <Section
              ref={(ref) => this.sectionRefs[index] = ref}
              injectElement={<IconButton style={{ marginBottom: 'auto' }} onClick={() => this.onRemove(index)}><Delete /></IconButton>}
              initialAccountId={accountId}
              onChange={(newAccountId) => this.onChange(index, newAccountId)}
              time={this.state.time}
              updateData={(data) => this.updateData(index, data)}
            />
            <hr />
          </div>
        ))}

        <IconButton onClick={() => this.addNew()}><Add /></IconButton>
        <IconButton onClick={() => this.setState({ chartData: this.chartData })}><Add /></IconButton>
        <Pie
          data={this.realChartData}
          options={{
            title: {
              display: true,
            },
            plugins: {
              colorschemes: {
                scheme: 'tableau.ClassicCyclic13'
              }
            }
          }}
        />
      </div>
    )
  }
}

export default connect(VisualizationScreen)
