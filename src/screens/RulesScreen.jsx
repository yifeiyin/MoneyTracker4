import React from 'react';
import { Accordion, AccordionSummary, AccordionDetails, TextField, IconButton, Button } from '@material-ui/core'
import { connect } from '../overmind'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import DeleteIcon from '@material-ui/icons/Delete'
import { withSnackbar } from 'notistack';
import { Statement } from '../rules';

class RulesScreen extends React.Component {

  state = {
    groups: [],
  }

  componentDidMount() {
    this.load();
  }

  load = () => {
    const { rules } = this.props.overmind.state;
    this.setState({ groups: rules })
  }

  save = () => {
    let groups = deepCopy(this.state.groups)
      .map(({ id, newId, rules }) => ({ id: newId ?? id, rules }))
      .sort((a, b) => a.id === b.id ? 0 : a.id < b.id ? -1 : 1);

    for (let group of groups) {
      group.rules = group.rules.map((rule, index) => {
        if (rule.index < 0)
          return false

        rule.index = Number(rule.index ?? (index + 1) * 2);
        return rule
      })
        .filter(Boolean)
        .sort((a, b) => a.index - b.index)
        .map(rule => {
          delete rule.index;
          return rule;
        })
    }

    const { saveRules } = this.props.overmind.actions;
    saveRules(groups);
    this.load();
    this.props.enqueueSnackbar('Saved.', { variant: 'success' });
  }

  onChangeGroupId = (groupId, newId) => {
    const newGroups = deepCopy(this.state.groups);
    newGroups.filter(group => group.id === groupId)[0].newId = newId;
    this.setState({ groups: newGroups });
  }

  onChange = (groupId, index, key, newValue) => {
    const newGroups = deepCopy(this.state.groups);
    newGroups.filter(group => group.id === groupId)[0].rules[index][key] = newValue;
    this.setState({ groups: newGroups });
  }

  addItem = (groupId) => {
    const newGroups = deepCopy(this.state.groups);
    const newRule = { if: '', then: '' };
    newGroups.filter(group => group.id === groupId)[0].rules.push(newRule);
    this.setState({ groups: newGroups })
  }

  deleteItem = (groupId, index) => {
    const newGroups = deepCopy(this.state.groups);
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
          this.state.groups.map(({ id, newId, rules }) =>
            <Accordion key={id} defaultExpanded>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`${id}-content`}
                id={`${id}-header`}
              >
                <TextField label="Group Id" value={newId ?? id} onChange={(e) => { this.onChangeGroupId(id, e.target.value) }} className="monospace-input" />
              </AccordionSummary>
              <AccordionDetails>
                <div className="rules-container">
                  {
                    rules.map((rule, index) =>
                      <div key={index} className="if-then-container">
                        <IconButton size='small' onClick={() => this.deleteItem(id, index)}><DeleteIcon /></IconButton>
                        <TextField label="Order" value={String(rule.index ?? (index + 1) * 2)} onChange={(e) => this.onChange(id, index, 'index', e.target.value)} className="monospace-input" />
                        <TextField fullWidth label="if" error={isValidStatement(rule.if)} value={String(rule.if)} onChange={(e) => this.onChange(id, index, 'if', e.target.value)} className="monospace-input" />
                        <TextField fullWidth label="then" error={isValidStatement(rule.then)} value={String(rule.then)} onChange={(e) => this.onChange(id, index, 'then', e.target.value)} className="monospace-input" />
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
export default withSnackbar(connect(RulesScreen))


function getRandomGroupId() {
  return 'Group ' + String(Math.random()).substr(2, 4);
}

function deepCopy(o) {
  return JSON.parse(JSON.stringify(o))
}

function isValidStatement(s) {
  try {
    new Statement(s)
    return false
  } catch {
    return true
  }
}
