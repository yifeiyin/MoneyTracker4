import React from 'react';
import { Button, ButtonGroup, Card, CardContent, CardActions, Typography, IconButton } from '@material-ui/core';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import { connect } from '../overmind'
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';

import { BMODebit, BMOCredit } from '_core/extendedRules'
import { formatDate } from '_core/helpers'

import { transformStatement as creditToItems } from '_core/extendedRules/bmoCredit'

import { DropzoneArea } from 'material-ui-dropzone';

import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileCopy as FileCopyIcon,
} from '@material-ui/icons';
import ObjectEditor from '../ObjectEditor';
import { FileItemCreateFormat, RunScriptFormat } from '../ObjectEditor/ObjectFormats';

import StateRemove1Icon from '@material-ui/icons/HighlightOff';
import StateRemove2Icon from '@material-ui/icons/NotInterested';
import StateAdd1Icon from '@material-ui/icons/CheckCircleOutline';
import StateAdd2Icon from '@material-ui/icons/ControlPoint';
import StatePending1Icon from '@material-ui/icons/BlurCircular';
import StatePending2Icon from '@material-ui/icons/RadioButtonUnchecked';
import { withSnackbar } from 'notistack';

const PENDING = 'pending';
const ADD = 'add';
const IGNORE = 'ignore';

function ImportItemState({ state }) {
  if (!([PENDING, ADD, IGNORE].includes(state)))
    return (
      <span className='text-red-500'>Unexpected state: {state}</span>
    )

  const [color, Icon, text] = {
    [PENDING]: ['yellow', StatePending1Icon, 'PENDING'],
    [ADD]: ['green', StateAdd1Icon, 'ADD'],
    [IGNORE]: ['red', StateRemove1Icon, 'IGNORE'],
  }[state];

  return (
    <span className={`flex items-center w-24 bg-${color}-400 rounded p-0.5 m-1.5`}>
      <span className='text-white px-0.5 flex-1 text-center'>{text}</span>
      <Icon className='text-white' />
    </span>
  )
}

class ImportScreen extends React.Component {

  state = {
    dropzonePromptText: '',
    canUpload: false,
    items: [],
  };

  resetAll = () => {
    this.setState({
      items: [],
    })
  }

  tryParse = (files) => {
    const file = files[0];
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      let rawFileContent = atob(reader.result.split('base64,')[1]);
      let newItems, errorText;
      try {
        newItems = creditToItems(rawFileContent, 'TODO');
      } catch (error) {
        this.props.enqueueSnackbar(String(error), { variant: 'error' });
        errorText = 'ERROR';
      }

      if (errorText) {
        this.setState({ dropzonePromptText: errorText, canUpload: false });
      } else {
        this._newItems = newItems;
        this.setState({ dropzonePromptText: newItems.length + ' item(s)', canUpload: true });
      }

    }, false);

    if (file) {
      reader.readAsDataURL(file);
    }
  }

  upload = () => {
    const contents = this._newItems;
    delete this._newItems;

    this.setState({ items: contents.map((content, index) => ({ state: PENDING, id: String(index), content })) });
  }

  finalize = () => {

  }

  render() {
    return (
      <div>
        <div className="flex">
          <Button variant='outlined' onClick={() => this.resetAll()}>Reset All</Button>
          <div className='w-40 h-10 overflow-hidden'>
            <DropzoneArea filesLimit={1} acceptedFiles={['text/*']} dropzoneText={this.state.dropzonePromptText} onChange={(files) => this.tryParse(files)} />
          </div>
          <Button variant='outlined' disabled={!this.state.canUpload} onClick={() => this.upload()}>Upload</Button>
          <Button variant='outlined' onClick={() => this.finalize()}>finalize</Button>
        </div>

        <div className="flex">
          <div className="overflow-scroll flex-1 max-h-screen">
            {this.state.items.map(item =>
              <ListItem key={item.id} state={item.state} content={item.content} />
            )}
          </div>
          <div style={{ flex: 2 }}>
            hi
          </div>
        </div>
      </div>
    );
  }
}

function ListItem({ state, content }) {
  return (
    <Card className='m-2'>
      <CardContent>
        <Typography variant='subtitle1'>{JSON.stringify(content)}</Typography>
        <Typography variant='subtitle1'>{content.amount}</Typography>
        <Typography variant='subtitle1'>{formatDate(content.$time, false)}</Typography>
        {/* <Typography variant='subtitle2'>{file.type}</Typography> */}
        {/* <Typography variant='body2'>{file.lastChanged}</Typography> */}
      </CardContent>
      <ImportItemState state={state} />
    </Card>
  )
}

export default withSnackbar(connect(ImportScreen))
