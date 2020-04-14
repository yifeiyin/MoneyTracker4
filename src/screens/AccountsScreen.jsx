import React from 'react';
import { Button, IconButton, TextField } from '@material-ui/core';
import { TreeView, TreeItem } from '@material-ui/lab';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import EditIcon from '@material-ui/icons/Edit';

import ObjectEditor from '../ObjectEditor/index';

const AccountFormat = {
  title: 'Account $name ($id)',
  fields: [
    {
      id: 'id',
      type: 'input',
    },
    {
      id: 'name',
      type: 'input',
    },
    {
      id: 'parentId',
      type: 'input',
    },
    {
      id: 'isFolder',
      type: 'boolean',
    },
    {
      id: 'accountType',
      type: 'input',
    },
    {
      id: 'description',
      type: 'multiline',
    },
  ]
}


export default class ImportExportScreen extends React.Component {
  state = {
    treeData: global.accountManager.getTreeData(),
    accountId: null,
    accountValue: {},
  }

  onStartEdit = (id) => {
    // this.ObjectEditor.setData(AccountFormat, this.state.accountValue);

    const account = global.accountManager._accountNodes[id];
    const accountValue = Object.assign({}, account);
    accountValue.id = id;
    this.setState({ accountValue });
  }

  render() {
    console.log(this.state.accountValue);
    return (
      <>
        <TreeView
          defaultCollapseIcon={<ExpandMoreIcon />}
          defaultExpanded={["0", "10", "20", "30"]}
          defaultExpandIcon={<ChevronRightIcon />}
          style={{
            width: '300px',
            float: 'left',
            '--tree-view-color': 'gray',
            '--tree-view-bg-color': 'blue',
          }}
        >
          {renderTree(this.state.treeData, this.onStartEdit)}
        </TreeView>

        <ObjectEditor
          format={AccountFormat}
          values={this.state.accountValue}
          onChange={(accountValue) => this.setState({ accountValue })}
        />
      </>
    );
  }
}

const renderTree = (nodes, onStartEdit) => (
  <TreeItem
    key={nodes.id}
    nodeId={nodes.id}
    label={
      <div style={{ fontSize: 18, padding: 5, display: 'flex', alignItems: 'center' }} onDoubleClick={() => { console.log('dbl') }}>
        {nodes.name}

        <IconButton style={{ alignSelf: 'flex-end', marginLeft: 'auto' }} onClick={() => { onStartEdit(nodes.id) }}>
          <EditIcon color="inherit" />
        </IconButton>
      </div>
    }
  >
    {Array.isArray(nodes.children) ? nodes.children.map((node) => renderTree(node, onStartEdit)) : null}
  </TreeItem>
);


