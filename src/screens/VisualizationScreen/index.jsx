import { Button, IconButton, TextField } from '@material-ui/core';
import { Add, Delete } from '@material-ui/icons';
import React from 'react';
import { connect } from '../../overmind';
import Section from './Section'

import { Pie } from 'react-chartjs-2'

class VisualizationScreen extends React.Component {
  state = {
    accountIds: [],
    time: '2021-01',
  }

  sectionRefs = []

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
            />
            <hr />
          </div>
        ))}

        <IconButton onClick={() => this.addNew()}><Add /></IconButton>
        <Pie />
      </div>
    )
  }
}

export default connect(VisualizationScreen)
