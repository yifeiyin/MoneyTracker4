import { Button, IconButton } from '@material-ui/core';
import { Add, Delete } from '@material-ui/icons';
import React from 'react';
import { connect } from '../../overmind';
import Section from './Section'

class VisualizationScreen extends React.Component {

  state = {
    accountIds: [],
  }

  componentDidMount() {
    this.storage = this.props.overmind.effects.storage
    this.setState({
      accountIds: this.storage.get('visualization', [])
    })
  }

  onRemove = (index) => {
    const copy = this.state.accountIds.filter((_, i) => i !== index);
    this.setState({ accountIds: copy });
    this.storage.set('visualization', copy);
  }

  onChange = (index, accountId) => {
    const copy = [...this.state.accountIds];
    copy[index] = accountId;
    this.setState({ accountIds: copy });
    this.storage.set('visualization', copy);
  }

  addNew = () => {
    this.onChange(this.state.accountIds.length, 0)
  }

  render() {
    return (
      <div>
        {this.state.accountIds.map((accountId, index) => (
          <div>
            <Section
              injectElement={<IconButton style={{ marginBottom: 'auto' }} onClick={() => this.onRemove(index)}><Delete /></IconButton>}
              initialAccountId={accountId}
              onChange={(newAccountId) => this.onChange(index, newAccountId)}
            />
            <hr />
          </div>
        ))}

        <IconButton onClick={() => this.addNew()}><Add /></IconButton>
      </div>
    )
  }
}

export default connect(VisualizationScreen)
