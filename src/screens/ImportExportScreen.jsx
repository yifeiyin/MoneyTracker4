import React from 'react';
import { Button, ButtonGroup, Card, CardContent, CardActions, Typography, IconButton } from '@material-ui/core';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';

import { DropzoneArea } from 'material-ui-dropzone';

import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileCopy as FileCopyIcon,
} from '@material-ui/icons';
import ObjectEditor from '../ObjectEditor';
import { FileItemCreateFormat } from '../ObjectEditor/ObjectFormats';


const initialCode = `function transform(file, Monum, accountsNameToId, console) {    // ==== start ====

  return [{ title, time, credits, debits, description,
    importBatch, importId }];


}    // ==== end ====`;


const fileTypes = {
  'Transform Statement': { format: 'js', executable: true, inputs: ['Plain Text'], outputs: ['JSON'] },  // Transform csv into array of strings
  'Generate Transactions': { format: 'js', executable: true, inputs: ['JSON'], outputs: ['JSON'] },      // Apply rules, string to transaction objects
  'Post-Process Transactions': { format: 'js', executable: true, inputs: ['JSON'], outputs: ['JSON'] },  // Post-process to assert outputs, transform shorthand syntax
  'Commit Transactions': { format: 'none', executable: true, inputs: ['JSON'] },                         // Commit
  'JSON': { format: 'json', executable: false },                       // json, non executable
  'Plain Text': { format: 'plain', executable: false },                // non executable
};


export default class ImportExportScreen extends React.Component {

  state = {
    fileList: [],
    currentEditingFileIndex: null,
    currentEditorContent: null,
    currentEditorType: null,
    newFileValues: {},
  };

  componentDidMount() {
    const fileList = JSON.parse(localStorage.getItem('fileList')) || [];
    this.setState({ fileList });
  }

  startEditFile = (newFileIndex) => {
    if (
      this.state.currentEditingFileIndex !== null &&
      this.state.currentEditingFileIndex !== newFileIndex
    ) {
      // Switch from a editing mode, auto-save previous changes
      this.onFileEditSave();
    }

    if (newFileIndex === null) {
      return this.setState({
        currentEditingFileIndex: null,
        currentEditorContent: null,
        currentEditorType: null,
      });
    }

    const targetFile = this.state.fileList[newFileIndex];
    const targetFileType = fileTypes[targetFile.type].format;

    this.setState({
      currentEditingFileIndex: newFileIndex,
      currentEditorContent: targetFile.content,
      currentEditorType: targetFileType,
    });
  }

  onFileEditChange = (newValue) => {
    this.setState({ currentEditorContent: newValue });
  }

  onFileEditSave = () => {
    const contentToSave = this.state.currentEditorContent;
    this.state.fileList[this.state.currentEditingFileIndex].content = contentToSave;          // eslint-disable-line react/no-direct-mutation-state
    this.state.fileList[this.state.currentEditingFileIndex].lastChanged = getTimeAsString();  // eslint-disable-line react/no-direct-mutation-state
    this.setState({ fileList: this.state.fileList });
    localStorage.setItem('fileList', JSON.stringify(this.state.fileList));
  }

  onNewFileValuesChange = (newValue) => {
    this.setState({ newFileValues: newValue });
  }

  createNewFile = (newFile) => {
    this.setState({ fileList: [...this.state.fileList, newFile] });
    localStorage.setItem('fileList', JSON.stringify([...this.state.fileList, newFile]));
  }

  onCreateNewFileViaForm = () => {
    const newFileFormat = this.state.newFileValues;
    if (!newFileFormat.name) return alert('name is falsy!');
    if (!newFileFormat.type) return alert('type is falsy!');
    newFileFormat.lastChanged = getTimeAsString();
    newFileFormat.content = getNewFileContent(newFileFormat.type);

    this.setState({ newFileValues: {} });
    this.createNewFile(newFileFormat);
  }

  onDeleteFile = (index) => {
    const currentEditingFileIndex = this.state.currentEditingFileIndex;
    const newFileList = this.state.fileList.filter((v, i) => i !== index);
    if (currentEditingFileIndex === index) {
      this.setState({ fileList: newFileList, currentEditingFileIndex: null, currentEditorContent: null, currentEditorType: null });
    } else if (currentEditingFileIndex > index) {
      this.setState({ fileList: newFileList, currentEditingFileIndex: currentEditingFileIndex - 1 });
    } else if (currentEditingFileIndex < index) {
      this.setState({ fileList: newFileList });
    }
    localStorage.setItem('fileList', JSON.stringify(newFileList));
  }

  onDuplicateFile = (index) => {
    const duplicated = JSON.parse(JSON.stringify(this.state.fileList[index]));
    duplicated.name += ' (Copy)';
    duplicated.lastChanged = getTimeAsString();
    this.setState({ fileList: [...this.state.fileList, duplicated] });
    localStorage.setItem('fileList', JSON.stringify([...this.state.fileList, duplicated]));
  }

  onRenameFile = (index) => {
    const newName = prompt('New name?', this.state.fileList[index].name);
    if (!newName) return;
    this.state.fileList[index].name = newName;           // eslint-disable-line react/no-direct-mutation-state
    this.setState({ fileList: this.state.fileList });
    localStorage.setItem('fileList', JSON.stringify(this.state.fileList));
  }

  loadFile = (files) => {
    const file = files[0];
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      let fileContent = atob(reader.result.split('base64,')[1]);
      this.rawFileContent = fileContent;
      fileContent = fileContent.split('\n').map((line, index) => (index < 10 ? ' ' + index : index) + ' > ' + line).join('\n');
      this.setState({ fileContent });
    }, false);
    if (file) {
      reader.readAsDataURL(file);
    }
  }

  run = () => {
    // Prepare arguments
    const accounts = Object.keys(global.accountManager._accountNodes).map(id => ({ id, ...(global.accountManager._accountNodes[id]) }));
    const accountsMap = {};
    accounts.filter(account => account.isFolder === false).forEach(account => accountsMap[account.name] = account.id);
    const args = [this.rawFileContent, global.Monum, accountsMap, console];
    console.log('Arguments: ', args);

    // Preprocess code
    let lines = this.state.code.split('\n');
    let start, end;
    lines.forEach((line, index) => {
      if (line.includes('==== start')) start = index;
      if (line.includes('==== end')) end = index;
    });

    let codeOfInterest = lines.slice(start + 1, end).join('\n');


    // (function (eval_js, load_js) {
    //   try {
    //     eval(eval_js);
    //   } catch (e) {
    //     (function addCode(js) {
    //       var e = document.createElement('script');
    //       e.type = 'text/javascript';
    //       e.src = 'data:text/javascript;charset=utf-8,' + escape(js);
    //       document.body.appendChild(e);
    //       console.warn("Inserted Script for ", js);
    //     })(load_js.replace(/;/g, ";\n"));
    //     codeOfInterest = "";
    //     return false;
    //   }
    //   return false;
    // })("new Function('event', handlerCode)", codeOfInterest);

    // Run the code
    let result;
    try {
      // eslint-disable-next-line no-new-func
      const functionToRun = new Function('file', 'Monum', 'accountsNameToId', 'console', codeOfInterest);
      result = functionToRun(...args);
    } catch (error) {
      alert(error);
      console.error(error);
      return;
    }
    console.log(result);

    try {
      global.transactionManager.createTransaction(result);
    } catch (error) {
      alert(error);
      console.error(error);
    }
  }

  handleHighLight = (code) => {
    switch (this.state.currentEditorType) {
      case 'json':
        return highlight(code, languages.json, 'json');
      case 'js':
        return highlight(code, languages.js, 'js');
      case 'plain':
      case 'none':
        return code;
      default:
        console.warn('Unexpected highlight type: ' + this.state.currentEditorType);
    }
  }

  render() {
    return (
      <div>

        {/* File List */}
        <div>
          {
            this.state.fileList.map((file, index) =>
              <Card style={{ display: 'inline-block', margin: 5 }} elevation={index === this.state.currentEditingFileIndex ? '6' : '1'}>
                <CardContent>
                  <Typography variant='subtitle1' onDoubleClick={() => this.onRenameFile(index)}>{file.name}</Typography>
                  <Typography variant='subtitle2'>{file.type}</Typography>
                  <Typography variant='body'>{file.lastChanged}</Typography>
                </CardContent>
                <CardActions disableSpacing={true}>
                  <Button size='small' startIcon={<EditIcon />} onClick={() => this.startEditFile(index)}>Edit</Button>
                  <div style={{ flex: 1 }}></div>
                  <IconButton size='small' onClick={() => this.onDuplicateFile(index)}><FileCopyIcon /></IconButton>
                  <IconButton size='small' onClick={() => this.onDeleteFile(index)}><DeleteIcon /></IconButton>
                </CardActions>
              </Card>
            )
          }
          <Card style={{ display: 'inline-block', padding: 5 }}>
            <ObjectEditor
              format={FileItemCreateFormat(fileTypes)}
              values={this.state.newFileValues}
              onChange={this.onNewFileValuesChange}
              onSave={this.onCreateNewFileViaForm}
            />
          </Card>
        </div>

        {/* File Actions */}
        {
          this.state.currentEditingFileIndex === null ? null :
            <div>
              <ButtonGroup style={{ margin: 5 }}>
                {/* <Button variant='outlined' color='primary' onClick={this.resetCode}>Reset</Button>
            <Button variant='outlined' color='primary' onClick={this.loadCode}>Reload</Button> */}
                <Button variant='contained' color='primary' onClick={this.onFileEditSave}>Save</Button>
              </ButtonGroup>
              {
                !fileTypes[this.state.fileList[this.state.currentEditingFileIndex].type].executable ? null :
                  <ButtonGroup style={{ margin: 5 }}>
                    <Button variant='contained' color='primary' onClick={this.run}>Run</Button>
                  </ButtonGroup>
              }
            </div>
        }


        {/* Editor */}
        {
          this.state.currentEditorType === 'none' ? <Typography variant='h5' style={{ margin: 40 }}>Nothing to edit</Typography> :
            this.state.currentEditorType === null ? <Typography variant='h5' style={{ margin: 40 }}>Select a file to edit</Typography> :
              <Editor
                value={this.state.currentEditorContent}
                onValueChange={newValue => this.onFileEditChange(newValue)}
                highlight={this.handleHighLight}
                padding={10}
                style={{
                  fontFamily: 'monospace',
                  fontSize: 18,
                }}
              />
        }


        {/* Bottom Drop Zone */}
        <div style={{ display: 'flex' }}>
          <div style={{ width: 200 }}>
            <DropzoneArea acceptedFiles={['text/*']} dropzoneText='' onChange={this.loadFile} />
          </div>
          <textarea style={{ fontFamily: 'monospace', height: 300, flex: 1 }} value={this.state.fileContent}></textarea>
        </div>

      </div>
    );
  }
}

// function addCode(js) {
//   var e = document.createElement('script');
//   e.type = 'text/javascript';
//   e.src = 'data:text/javascript;charset=utf-8,' + escape(js);
//   document.body.appendChild(e);
// }


function getTimeAsString() {
  return (new Date()).toLocaleString();
}

function getNewFileContent(type) {
  return '\n// ' + type + '\n\n\n\n\n\n';
}