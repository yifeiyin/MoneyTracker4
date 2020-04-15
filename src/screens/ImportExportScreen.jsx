import React from 'react';
import { Button, ButtonGroup } from '@material-ui/core';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';

import { DropzoneArea } from 'material-ui-dropzone';


const initialCode = `function transform(file, Monum, accountsNameToId, console) {    // ==== start ====

  return [{ title, time, credits, debits, description,
    importBatch, importId }];


}    // ==== end ====`;

export default class ImportExportScreen extends React.Component {
  state = {
    code: initialCode,
  };

  saveCode = () => {
    localStorage.setItem('code', this.state.code);
  }

  loadCode = () => {
    const c = localStorage.getItem('code');
    this.setState({ code: c === null ? initialCode : c });
  }

  resetCode = () => {
    this.setState({ code: initialCode });
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

  render() {
    return (
      <div>
        <div>
          <ButtonGroup style={{ margin: 5 }}>
            <Button variant='outlined' color='primary' onClick={this.resetCode}>Reset</Button>
            <Button variant='outlined' color='primary' onClick={this.loadCode}>Reload</Button>
            <Button variant='contained' color='primary' onClick={this.saveCode}>Save</Button>
          </ButtonGroup>
          <ButtonGroup style={{ margin: 5 }}>
            <Button variant='contained' color='primary' onClick={this.run}>Run</Button>
          </ButtonGroup>
        </div>
        <Editor
          value={this.state.code}
          onValueChange={code => this.setState({ code })}
          highlight={code => highlight(code, languages.js, 'js')}
          padding={10}
          style={{
            fontFamily: 'monospace',
            fontSize: 18,
          }}
        />
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


