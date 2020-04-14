import React from 'react';
import { IconButton } from '@material-ui/core';

import { TreeView, TreeItem } from '@material-ui/lab';

import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import EditIcon from '@material-ui/icons/Edit';


export default function AccountTreeView(props) {
  const { treeData, style = {}, onEdit, onDoubleClick } = props;
  return (
    <TreeView
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpanded={["0", "10", "20", "30"]}
      defaultExpandIcon={<ChevronRightIcon />}
      style={{
        ...style,
        '--tree-view-color': 'gray',
        '--tree-view-bg-color': 'blue',
      }}
    >
      {renderTree(treeData, onEdit, onDoubleClick)}
    </TreeView>

  );
}

const renderTree = (nodes, onEdit, onDoubleClick) => (
  (nodes instanceof Array) ?
    nodes.map((node) => renderTree(node, onEdit, onDoubleClick))
    :
    <TreeItem
      key={nodes.id}
      nodeId={nodes.id}
      label={
        <div style={{ fontSize: 18, padding: 5, display: 'flex', alignItems: 'center' }} onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick && onDoubleClick(nodes.id); }}>
          {nodes.name}
          {
            !onEdit ? null :
              <IconButton style={{ alignSelf: 'flex-end', marginLeft: 'auto' }} onClick={(e) => { e.stopPropagation(); onEdit(nodes.id) }}>
                <EditIcon color="inherit" />
              </IconButton>
          }
        </div>
      }
    >
      {Array.isArray(nodes.children) ? nodes.children.map((node) => renderTree(node, onEdit, onDoubleClick)) : null}
    </TreeItem>
);
