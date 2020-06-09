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
} from '@material-ui/icons';


class DataManagementScreen extends React.Component {

  state = {
    dataSet: null,
  }

  get allDataSet() {
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

    const savedDataSet = localStorage.getItem('savedDataSet') || [];
    return [currentDataSet, ...savedDataSet];
  }

  addNewItem(data) {

  }

  render() {
    return (
      <div style={{ display: 'flex' }}>
        <div style={{ flex: 1, borderRight: '1px solid black' }}>
          {this.allDataSet.map(data =>
            <DataSet
              title={data.title}
              lastChanged={data.lastChanged}
              onClick={() => this.setState({ dataSet: data })}
              onDuplicateFile={() => navigator.clipboard.readText().then(console.log)}
            />
          )}
        </div>
        <div style={{ flex: 3 }}>
          {
            this.state.dataSet &&
            <DataSetDetails {...this.state.dataSet} />
          }
        </div>
      </div>
    );
  }
}

export default withSnackbar(DataManagementScreen);

function DataSet({
  title,
  isSelected = false,
  onClick,
  onRenameFile,
  startEditFile,
  onDuplicateFile,
  onDeleteFile,
  lastChanged,
}) {
  return (
    <Card style={{ display: 'inline-block', margin: 5 }} elevation={isSelected ? '6' : '1'} onClick={onClick}>
      <CardContent>
        <Typography variant='subtitle1' onDoubleClick={onRenameFile}>{title}</Typography>
        {/* <Typography variant='subtitle2'>{file.type}</Typography> */}
        <Typography variant='body'>{lastChanged}</Typography>
      </CardContent>
      <CardActions disableSpacing={true}>
        <Button size='small' startIcon={<EditIcon />} onClick={startEditFile}>Edit</Button>
        <div style={{ flex: 1 }}></div>
        <IconButton size='small' onClick={onDuplicateFile}><FileCopyIcon /></IconButton>
        <IconButton size='small' onClick={onDeleteFile}><DeleteIcon /></IconButton>
        <IconButton size='small' onClick={onDeleteFile}><SaveAltIcon /></IconButton>
      </CardActions>
    </Card>
  );
}

function DataSetDetails({ title, lastChanged, data }) {

  const dataTable = [];
  for (const key in data) {
    const value = data[key];
    let display;
    switch (key) {
      case 't': display = Object.values(value._transactions).length + ' Transactions'; break;
      case 's': display = Object.values(value._schedules).length + ' Schedules'; break;
      case 'a': display = Object.values(value._accountNodes).length + ' Accounts'; break;
      case 'm': display = Object.values(value.acceptableCurrencies).join(', ') + ' Accepted'; break;
      case 'fileList': display = value.length + ' Files'; break;
      default: display = 'Unknown type: ' + JSON.stringify(value).substr(0, 30);
    }
    dataTable.push([key, display]);
  }

  return (
    <div>
      <Table>
        <TableBody>
          {
            dataTable.map(([key, value]) =>
              <TableRow>
                <TableCell>{key}</TableCell>
                <TableCell>{value}</TableCell>
              </TableRow>
            )
          }
        </TableBody>
      </Table>
      <p>{JSON.stringify(data)}</p>
    </div>
  );
}
