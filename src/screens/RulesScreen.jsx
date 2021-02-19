import React from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Typography, Input, TextField, FormGroup, IconButton, Button } from '@material-ui/core'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import DeleteIcon from '@material-ui/icons/Delete'

export default class RulesScreen extends React.Component {

  state = {
    groups: [],
  }

  componentDidMount() {
    this.setState({
      groups: [{
        id: 'test',
        rules: [{
          if: '1', then: '2'
        }]
      }]
    })
  }

  load = () => {

  }

  save = () => {

  }

  onChange = (groupId, index, key, newValue) => {
    const newGroups = this.state.groups;
    newGroups.filter(group => group.id === groupId)[0].rules[index][key] = newValue;
    this.setState({ groups: newGroups });
  }

  addItem = (groupId) => {
    const newGroups = this.state.groups;
    const newRule = { if: '', then: '' };
    newGroups.filter(group => group.id === groupId)[0].rules.push(newRule);
    this.setState({ groups: newGroups })
  }

  deleteItem = (groupId, index) => {
    const newGroups = this.state.groups;
    const deletedRule = { index: -1, if: '', then: '' };
    newGroups.filter(group => group.id === groupId)[0].rules[index] = deletedRule;
    this.setState({ groups: newGroups })
  }

  deleteGroup = (groupId) => {
    this.setState({ groups: this.state.groups.filter(group => group.id !== groupId) })
  }

  addGroup = () => {
    const newGroup = { id: getRandomGroupId(), rules: [] };
    this.setState({ groups: [...this.state.groups, newGroup] })
  }

  render() {
    return (
      <div>
        <Button variant="outlined" color="primary" onClick={() => this.load()}>Reload</Button>
        <Button variant="outlined" color="primary" onClick={() => this.save()}>Save</Button>
        {
          this.state.groups.map(({ id, rules }) =>
            <Accordion key={id} defaultExpanded>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`${id}-content`}
                id={`${id}-header`}
              >
                <TextField label="Group Id" value={id} className="monospace-input" />
              </AccordionSummary>
              <AccordionDetails>
                <div className="rules-container">
                  {
                    rules.map((rule, index) =>
                      <div key={index} className="if-then-container">
                        <IconButton size='small' onClick={() => this.deleteItem(id, index)}><DeleteIcon /></IconButton>
                        <TextField label="Order" value={String(rule.index ?? (index + 1) * 2)} onChange={(e) => this.onChange(id, index, 'index', e.target.value)} className="monospace-input" />
                        <TextField fullWidth label="if" value={String(rule.if)} onChange={(e) => this.onChange(id, index, 'if', e.target.value)} className="monospace-input" />
                        <TextField fullWidth label="then" value={String(rule.then)} onChange={(e) => this.onChange(id, index, 'then', e.target.value)} className="monospace-input" />
                      </div>
                    )
                  }
                  <Button variant="outlined" color="primary" onClick={() => this.addItem(id)}>Add</Button>
                  <Button variant="outlined" color="primary" onClick={() => this.deleteGroup(id)}>Delete Group</Button>
                </div>
              </AccordionDetails>
            </Accordion>
          )
        }
        <Button variant="outlined" color="primary" onClick={() => this.addGroup()}>Add Group</Button>
      </div>)
  }
}

function getRandomGroupId() {
  return 'Group ' + String(Math.random() * 10000).substr(0, 4);
}
