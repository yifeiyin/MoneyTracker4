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
      createdAt: '(current)',
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

  updateDataSet = (exec) => {
    const result = exec(this.savedDataSets);
    if (result !== undefined && result !== null) {
      localStorage.setItem('savedDataSets', JSON.stringify(result));
      this.refresh();
    }
  }


  //
  // for list view master
  //

  downloadAll = () => {

  }

  resetAllUsingPasteBoard = () => {

  }

  //
  // for list view
  //

  createEmptyDataSet = () => {
    this.updateDataSet((ds) => {
      ds.push({
        title: 'New Empty Dataset ' + this.state.allDataSet.length,
        createdAt: getTimeAsString(),
        data: {},
      });
      return ds;
    });
  }

  pasteDataSet = async () => {
    const content = await getClipboardContent();
    if (content === null) {
      this.props.enqueueSnackbar('Unrecognized clipboard content.', { variant: 'error' });
      return;
    }
    const dataSet = {
      title: 'Imported Data ' + this.state.allDataSet.length,
      createdAt: getTimeAsString(),
      data: content,
    };
    this.updateDataSet((ds) => {
      ds.push(dataSet);
      return ds;
    });
    this.props.enqueueSnackbar(Object.keys(content).length + 'item(s) imported.', { variant: 'success' });
  }

  onDeleteFile = (index) => {
    this.updateDataSet((ds) => {
      ds.splice(index, 1);
      return ds;
    });
    if (index === this.state.selectedIndex - 1) {
      console.assert(index !== 0);
      this.setSelected(null);
    } else if (index < this.state.selectedIndex - 1) {
      this.setSelected(this.state.selectedIndex - 1);
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

  onDuplicateFile = (index) => {
    const data = JSON.parse(JSON.stringify(this.state.allDataSet[index].data));
    const newDataSet = {
      title: 'New Saved Data Set ' + this.state.allDataSet.length,
      createdAt: getTimeAsString(),
      data,
    };
    this.updateDataSet((ds) => {
      ds.splice(index, 0, newDataSet);
      return ds;
    });
    this.props.enqueueSnackbar('Duplicated.', { variant: 'success' });
  }

  //
  // for details view
  //

  onCopyDataItem = async (key, appending = false) => {
    const value = this.state.dataSet.data[key];
    let existingData = await getClipboardContent();
    if (appending && existingData !== null) {
      existingData[key] = value;
    } else {
      existingData = { [key]: value };
    }
    await setClipboardContent(existingData);
    const keyCount = Object.keys(existingData).length;
    const message = 'Data added to clipboard.' + (
      keyCount === 1 ? '' : ` (${keyCount} items)`
    );
    this.props.enqueueSnackbar(message, { variant: 'success' });
  }

  onDeleteDataItem = (key) => {
    const index = this.state.selectedIndex - 1;
    delete this.state.dataSet.data[key];
    this.updateDataSet((ds) => {
      delete ds[index].data[key];
      return ds;
    });
    this.props.enqueueSnackbar('Deleted.', { variant: 'success' });
  }

  onPasteOverride = async () => {
    const content = await getClipboardContent();
    if (content === null) {
      this.props.enqueueSnackbar('Unrecognized clipboard content.', { variant: 'error' });
      return;
    }
    const index = this.state.selectedIndex - 1;
    Object.assign(this.state.dataSet.data, content);
    this.updateDataSet((ds) => {
      Object.assign(ds[index].data, content);
      return ds;
    });
    this.props.enqueueSnackbar('Updated.', { variant: 'success' });
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
              createdAt={data.createdAt}
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
              isTheCurrentOne={this.state.selectedIndex === 0}
              onCopyDataItem={this.onCopyDataItem}
              onDeleteDataItem={this.onDeleteDataItem}
              onPasteOverride={this.onPasteOverride}
            />
          }
        </div>
      </div>
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
  createdAt,
}) {
  if (isTheCurrentOne)
    return (
      <Card style={{ margin: 15 }} elevation={isSelected ? 6 : 1} onClick={onClick}>
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
      <Card style={{ margin: 15 }} elevation={isSelected ? 6 : 1} onClick={onClick}>
        <CardContent>
          <Typography variant='subtitle1' onDoubleClick={onRenameFile}>{title}</Typography>
          <Typography variant='subtitle2'>{createdAt}</Typography>
        </CardContent>
        <CardActions disableSpacing={true}>
          <Button size='small' startIcon={<GavelIcon />} onClick={onUseThisFile}>Use</Button>
          <div style={{ flex: 1 }}></div>
          <IconButton size='small' onClick={onDuplicateFile}><FileCopyIcon /></IconButton>
          <IconButton size='small' onClick={onDeleteFile}><DeleteIcon /></IconButton>
        </CardActions>
      </Card>
    );
}

function DataSetDetails({
  isTheCurrentOne,
  title,
  createdAt,
  data,
  onCopyDataItem,
  onDeleteDataItem,
  onPasteOverride,
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
    dataTable.push([...row, key]);
  }

  dataTable.sort();

  return (
    <div>
      <Button color='primary' variant='outlined' startIcon={<AssignmentReturnedIcon />} onClick={onPasteOverride}>{'Paste & Override'}</Button>
      <Table>
        <TableBody>
          {
            dataTable.map(([displayKey, displayValue, rawKey]) =>
              <TableRow key={rawKey} style={{ display: 'flex' }}>
                <TableCell style={{ flex: 1 }} align='right'>{displayKey}</TableCell>
                <TableCell style={{ flex: 2 }} align='left'>{displayValue}</TableCell>
                <TableCell style={{ flex: 1 }} align='left'>
                  <IconButton size='medium' onClick={() => onCopyDataItem(rawKey)}><FileCopyIcon /></IconButton>
                  <IconButton size='medium' onClick={() => onCopyDataItem(rawKey, true)}><PlusOneIcon /></IconButton>
                  {!isTheCurrentOne &&
                    <IconButton size='medium' onClick={() => onDeleteDataItem(rawKey)}><DeleteIcon /></IconButton>
                  }
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

async function getClipboardContent() {
  const text = await navigator.clipboard.readText();
  try {
    const content = JSON.parse(text);
    if (typeof (content) === 'object' && content.__fromMT === true) {
      return content.__content;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
}

async function setClipboardContent(content) {
  const contentToSave = {
    __fromMT: true,
    __content: content,
  }
  return navigator.clipboard.writeText(JSON.stringify(contentToSave));
}
