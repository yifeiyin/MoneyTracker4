import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import CssBaseline from '@material-ui/core/CssBaseline';

// import { Provider } from 'react-redux'
// import store from './store'

import { SnackbarProvider } from 'notistack';

import { AccountManager } from './core/account-manager';
import { Monum } from './core/monum';
import { ScheduleContainer } from './core/schedule-container';
import { TransactionContainer } from './core/transaction-container';
import { TransactionManager } from './core/transaction-manager';

import DateFnsUtils from '@date-io/date-fns';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';

if (global.deepCopyReviver) console.error('deepCopyReviver is already defined.');
global.deepCopyReviver = (k, v) => {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/.test(v) ? new Date(v) :
    v._class === 'monum' ? Monum.fromObject(v) : v;
};

if (global.deepCopy) console.error('deepCopy is already defined.');
global.deepCopy = function (obj) {
  return this.JSON.parse(JSON.stringify(obj), global.deepCopyReviver);
}

global.loadInitialData = function () {
  console.log('Loading new app instance');
  global.accountManager = new AccountManager(JSON.stringify(require('./sampleData/Accounts.json')));

  global.Monum = Monum;
  global.Monum.setup.fromJSON(JSON.stringify(require('./sampleData/Monum Setup.json')));

  global.transactionContainer = new TransactionContainer();
  global.transactionContainer.fromJSON(JSON.stringify(require('./sampleData/Transactions.json')));

  global.scheduleContainer = new ScheduleContainer();
  global.scheduleContainer.fromJSON(JSON.stringify(require('./sampleData/Schedules.json')));

  global.transactionManager = new TransactionManager(global.transactionContainer, global.scheduleContainer, global.accountManager);

}

global.loadAllData = function () {
  global.accountManager = new AccountManager(localStorage.getItem('a'));

  global.Monum = Monum;
  global.Monum.setup.fromJSON(localStorage.getItem('m'));

  global.transactionContainer = new TransactionContainer();
  global.transactionContainer.fromJSON(localStorage.getItem('t'));

  global.scheduleContainer = new ScheduleContainer();
  global.scheduleContainer.fromJSON(localStorage.getItem('s'));

  global.transactionManager = new TransactionManager(global.transactionContainer, global.scheduleContainer, global.accountManager);
}

global.saveAllData = function () {
  try {
    localStorage.setItem('a', JSON.stringify(global.accountManager));
    localStorage.setItem('m', JSON.stringify(global.Monum.setup));
    localStorage.setItem('t', JSON.stringify(global.transactionContainer));
    localStorage.setItem('s', JSON.stringify(global.scheduleContainer));
  } catch (error) {
    this.console.error(error);
    return false;
  }
  this.console.log('Saved!');
  return true;
}

try {
  global.loadAllData();
} catch (error) {
  console.log('Error when trying to load from localStorage');
  console.log(error);
  global.loadInitialData();
}

ReactDOM.render(
  <React.StrictMode>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
    <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width" />
    <CssBaseline />
    {/* <Provider store={store}> */}
    <SnackbarProvider maxSnack={5} autoHideDuration={2500} anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'center',
    }}>
      <MuiPickersUtilsProvider utils={DateFnsUtils}>
        <App />
      </MuiPickersUtilsProvider>
    </SnackbarProvider>
    {/* </Provider> */}
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
