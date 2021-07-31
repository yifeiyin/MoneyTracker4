import React from 'react';
import { Button, Card, CardContent } from '@material-ui/core';
import { connect } from '../overmind'

import { formatDate, assert } from '_core/helpers'

import { transformStatement as creditToItems } from '_core/extendedRules/bmoCredit'

import { DropzoneArea } from 'material-ui-dropzone';

import ObjectEditor from '../ObjectEditor';
import { ImportFormat } from '../ObjectEditor/ObjectFormats';

import StateRemove1Icon from '@material-ui/icons/HighlightOff';
// import StateRemove2Icon from '@material-ui/icons/NotInterested';
import StateAdd1Icon from '@material-ui/icons/CheckCircleOutline';
// import StateAdd2Icon from '@material-ui/icons/ControlPoint';
import StatePending1Icon from '@material-ui/icons/BlurCircular';
// import StatePending2Icon from '@material-ui/icons/RadioButtonUnchecked';
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
    <span className={`flex items-center w-24 bg-${color}-400 rounded p-0.5 m-0.5`}>
      <span className='text-white px-0.5 flex-1 text-center'>{text}</span>
      <Icon className='text-white' />
    </span>
  )
}

class ImportScreen extends React.Component {
  state = {
    dropzonePromptText: '',
    canUpload: false,
    items: [{ state: PENDING, content: { _rawDesc: 'hi' }, id: '1' }],
    selectedItemId: null,
  };
  itemRefs = {};

  get currentSelectedItem() {
    const tmp = this.state.items.filter(item => item.id === this.state.selectedItemId)
    return tmp.length === 1 ? tmp[0] : null;
  }

  set currentSelectedItem(newValue) {
    // const items = deepCopy(this.state.items)
    this.setState({
      items: this.state.items.map(item => item.id === this.state.selectedItemId ? newValue : item)
    });
  }

  get currentFormValue() {
    if (this.currentSelectedItem)
      return this.currentSelectedItem.content;
    else
      return null;
  }

  set currentFormValue(newValue) {
    if (!this.currentSelectedItem)
      return;
    this.currentSelectedItem = { ...this.currentSelectedItem, content: newValue };
  }

  resetAll = () => {
    this.setState({
      dropzonePromptText: '',
      canUpload: false,
      items: [],
      selectedItemId: null,
    });
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

  onSelectItem = (item) => {
    this.setState({ selectedItemId: item.id });
    this.itemRefs[item.id].scrollIntoView({ behavior: "auto", block: "nearest", inline: "nearest" });
  }

  action = (markAs, goto) => {
    if (markAs !== '') {
      assert([PENDING, ADD, IGNORE].includes(markAs));
      this.currentSelectedItem = { ...this.currentSelectedItem, state: markAs };
    }

    const currentIndex = this.state.items.findIndex((item) => item.id === this.state.selectedItemId)
    if (goto === 'prev') {
      this.onSelectItem(this.state.items[Math.max(0, currentIndex - 1)]);
    } else if (goto === 'next') {
      this.onSelectItem(this.state.items[Math.min(this.state.items.length - 1, currentIndex + 1)]);
    }
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
          <div className="overflow-auto flex-1" style={{ height: 'calc(100vh - 130px)' }}>
            {this.state.items.map(item =>
              <ListItem
                // eslint-disable-next-line react/no-direct-mutation-state
                onRef={(ref) => this.itemRefs[item.id] = ref}
                key={item.id}
                state={item.state}
                content={item.content}
                isFocused={item.id === this.state.selectedItemId}
                onPress={() => this.onSelectItem(item)}
              />
            )}
          </div>
          <div className='flex flex-col' style={{ flex: 2, height: 'calc(100vh - 130px)' }}>
            <div className='flex-auto'>
              {
                this.currentFormValue &&
                <ObjectEditor
                  format={ImportFormat}
                  values={this.currentFormValue}
                  onChange={(currentFormValue) => this.currentFormValue = currentFormValue}
                />
              }
            </div>

            <div className="grid grid-cols-3 gap-x-4 gap-y-10 mt-20 p-16">
              <Button onClick={() => this.action(IGNORE, 'next')} variant='contained' color='primary'><ImportItemState state={IGNORE} />{' & Next'}</Button>
              <Button onClick={() => this.action(PENDING, 'next')} variant='contained' color='primary'><ImportItemState state={PENDING} />{' & Next'}</Button>
              <Button onClick={() => this.action(ADD, 'next')} variant='contained' color='primary'><ImportItemState state={ADD} />{' & Next'}</Button>

              <Button onClick={() => this.action(IGNORE, '')} variant='contained' color='default'><ImportItemState state={IGNORE} /></Button>
              <Button onClick={() => this.action(PENDING, '')} variant='contained' color='default'><ImportItemState state={PENDING} /></Button>
              <Button onClick={() => this.action(ADD, '')} variant='contained' color='default'><ImportItemState state={ADD} /></Button>

              <Button onClick={() => this.action('', 'prev')} variant='contained' color='default'>PREV</Button>
              <span></span>
              <Button onClick={() => this.action('', 'next')} variant='contained' color='default'>NEXT</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

function ListItem({ onRef, state, content, isFocused, onPress }) {
  let amountReadable = content?.amount;
  if (amountReadable?.toReadable) amountReadable = amountReadable.toReadable()

  const datetimeReadable = formatDate(content?.$time, false);
  const rawDescReadable = content?._rawDesc ?? '???';

  return (
    <Card ref={ref => onRef(ref)} raised={isFocused} onClick={onPress} className='m-2'>
      <CardContent>
        <div className="flex justify-between items-center">
          <ImportItemState state={state} />
          <span>{datetimeReadable}</span>
          <span>{amountReadable}</span>
        </div>
        <span className='font-mono'>{rawDescReadable}</span>
      </CardContent>
    </Card>
  )
}

export default withSnackbar(connect(ImportScreen))
