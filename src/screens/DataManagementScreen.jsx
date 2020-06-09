import React from 'react';
import {
  Button,
  ButtonGroup,
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Table,
  TableCell,
  TableBody,
  TableRow,
} from '@material-ui/core';
import { withSnackbar } from 'notistack';

import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileCopy as FileCopyIcon,
  SaveAlt as SaveAltIcon,
  AssignmentReturned as AssignmentReturnedIcon,
  Add as AddIcon,
  RotateLeft as RotateLeftIcon,
  PlusOne as PlusOneIcon,
  Gavel as GavelIcon,
} from '@material-ui/icons';


class DataManagementScreen extends React.Component {

  state = {
    selectedIndex: null,
    dataSet: null,
    allDataSet: [],
  }

  componentDidMount() {
    this.refresh();
  }

  refresh = () => {
    this.setState({ allDataSet: this.getAllDataSet() });
  }

  getAllDataSet() {
    const currentData = global.deepCopy(localStorage);
    for (const key in currentData) {
      if (!['a', 's', 'm', 't', 'fileList'].includes(key)) delete currentData[key];
      else currentData[key] = JSON.parse(currentData[key]);
    }

    const currentDataSet = {
      title: '(current)',
      lastChanged: '(current)',
      data: currentData,
    };

    const savedDataSets = this.savedDataSets;
    console.count('load');
    return [currentDataSet, ...savedDataSets];
  }

  get savedDataSets() {
    const a = localStorage.getItem('savedDataSets');
    return a ? JSON.parse(a, global.deepCopyReviver) : [];
  }

  setSelected = (index) => {
    if (index === null) {
      this.setState({ selectedIndex: null, dataSet: null });
    } else {
      this.setState({ selectedIndex: index, dataSet: this.state.allDataSet[index] });
    }
  }

  addNewItem = (data) => {

  }

  updateDataSet = (exec) => {
    const result = exec(this.savedDataSets);
    if (result !== undefined && result !== null) {
      localStorage.setItem('savedDataSets', JSON.stringify(result));
      this.refresh();
    }
  }

  createEmptyDataSet = () => {
    this.updateDataSet((ds) => {
      ds.push({
        title: 'New Empty Dataset ' + this.state.allDataSet.length,
        lastChanged: getTimeAsString(),
        data: {},
      });
      return ds;
    });
  }

  pasteDataSet = () => {

  }

  onDeleteFile = (index) => {
    this.updateDataSet((ds) => {
      ds.splice(index, 1);
      return ds;
    });
    if (index === this.state.selectedIndex) {
      console.assert(index !== 0);
      this.setSelected(null);
    }
  }

  renameFile = (index) => {
    this.updateDataSet((ds) => {
      const a = prompt('New name?');
      if (a) {
        ds[index].title = a;
        return ds;
      }
      return null;
    });
  };

  downloadAll = () => {
  }

  resetAllUsingPasteBoard = () => {

  }

  onCopyDataItem = ([key, value], appending = false) => {

  }

  onDeleteDataItem = (key) => {

  }

  onDuplicateFile = (index) => {
    // navigator.clipboard.readText().then(console.log)
  }


  render() {
    return (
      <div style={{ display: 'flex' }}>
        <div style={{ flex: 1, borderRight: '1px solid black' }}>
          <div>
            <Button color='primary' variant='outlined' startIcon={<AddIcon />} onClick={this.createEmptyDataSet}>Create Empty</Button>
            <Button color='primary' variant='outlined' startIcon={<AssignmentReturnedIcon />} onClick={this.pasteDataSet}>Paste</Button>
            <Button color='primary' variant='outlined' startIcon={<SaveAltIcon />} onClick={this.downloadAll}>Download All</Button>
            <Button color='primary' variant='outlined' startIcon={<RotateLeftIcon />} onClick={this.downloadAll}>Reset All Using Paste Board</Button>
          </div>
          {this.state.allDataSet.map((data, index) =>
            <DataSetCard
              isSelected={this.state.selectedIndex === index}
              isTheCurrentOne={index === 0}
              key={data.title}
              title={data.title}
              lastChanged={data.lastChanged}
              onClick={() => this.setSelected(index)}
              onDeleteFile={() => this.onDeleteFile(index - 1)}
              onUseThisFile={() => 1}
              onRenameFile={() => this.renameFile(index - 1)}
              onDuplicateFile={() => this.onDuplicateFile(index)}
            />
          )}
        </div>
        <div style={{ flex: 3 }}>
          {
            this.state.dataSet &&
            <DataSetDetails
              {...this.state.dataSet}
              onCopyDataItem={this.onCopyDataItem}
              onDeleteDataItem={this.onDeleteDataItem}
            />
          }
        </div>
      </div >
    );
  }
}

export default withSnackbar(DataManagementScreen);

function DataSetCard({
  isTheCurrentOne,
  title,
  isSelected = false,
  onClick,
  onRenameFile,
  onUseThisFile,
  onDuplicateFile,
  onDeleteFile,
  lastChanged,
}) {
  if (isTheCurrentOne)
    return (
      <Card style={{ margin: 15 }} elevation={isSelected ? '6' : '1'} onClick={onClick}>
        <CardContent>
          <Typography variant='subtitle1'>{title}</Typography>
        </CardContent>
        <CardActions disableSpacing={true}>
          <div style={{ flex: 1 }}></div>
          <IconButton size='small' onClick={onDuplicateFile}><FileCopyIcon /></IconButton>
        </CardActions>
      </Card>
    );
  else
    return (
      <Card style={{ margin: 15 }} elevation={isSelected ? '6' : '1'} onClick={onClick}>
        <CardContent>
          <Typography variant='subtitle1' onDoubleClick={onRenameFile}>{title}</Typography>
          <Typography variant='subtitle2'>{lastChanged}</Typography>
        </CardContent>
        <CardActions disableSpacing={true}>
          <Button size='small' startIcon={<GavelIcon />} onClick={onUseThisFile}>Override</Button>
          <div style={{ flex: 1 }}></div>
          <IconButton size='small' onClick={onDuplicateFile}><FileCopyIcon /></IconButton>
          <IconButton size='small' onClick={onDeleteFile}><DeleteIcon /></IconButton>
        </CardActions>
      </Card>
    );
}

function DataSetDetails({
  title,
  lastChanged,
  data,
  onCopyDataItem,
  onDeleteDataItem,
}) {

  const dataTable = [];
  for (const key in data) {
    const value = data[key];
    let row;
    switch (key) {
      case 't': row = ['Transactions', Object.values(value._transactions).length]; break;
      case 's': row = ['Schedules', Object.values(value._schedules).length]; break;
      case 'a': row = ['Accounts', Object.values(value._accountNodes).length]; break;
      case 'm': row = ['Accepted Currencies', Object.values(value.acceptableCurrencies).join(', ')]; break;
      case 'fileList': row = ['Files', value.length]; break;
      default: row = ['Unknown type: ' + key, JSON.stringify(value).substr(0, 30)];
    }
    dataTable.push(row);
  }

  return (
    <div>
      <Table>
        <TableBody>
          {
            dataTable.map(([key, value]) =>
              <TableRow>
                <TableCell align='right'>{key}</TableCell>
                <TableCell align='left'>{value}</TableCell>
                <TableCell align='left'>
                  <IconButton size='medium' onClick={() => onCopyDataItem([key, value])}><FileCopyIcon /></IconButton>
                  <IconButton size='medium' onClick={() => onCopyDataItem([key, value], true)}><PlusOneIcon /></IconButton>
                  <IconButton size='medium' onClick={() => onDeleteDataItem(key)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            )
          }
        </TableBody>
      </Table>
      <details open style={{ fontSize: 18 }}>
        <pre style={{ overflow: 'auto', maxWidth: '70vw', maxHeight: '48vh' }}>{JSON.stringify(data, null, 4)}</pre>
      </details>
    </div>
  );
}

function getTimeAsString() {
  return (new Date()).toLocaleString();
}
