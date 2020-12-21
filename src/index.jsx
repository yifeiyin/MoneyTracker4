import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import CssBaseline from '@material-ui/core/CssBaseline';

/** SnackBar */
import { SnackbarProvider } from 'notistack';

/** Date Picker */
import DateFnsUtils from '@date-io/date-fns';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';

/** Overmind */
import { createOvermind } from 'overmind';
import { Provider as OverMindProvider } from 'overmind-react'
import { config } from './overmind'

/** Dexie */
import Dexie from "dexie";

/** Core */
import AccountManager from './newCore/accounts';
import TransactionManager from './newCore/transactions';
import Monum from './newCore/monum';

/** Database setup */
const db = new Dexie('MyDatabase');
db.version(1).stores({
  accounts: '++id, name, parentId',
  transactions: '++id, time, title, debitsFrom, creditsFrom',
});

db.transactions.hook('reading', function (obj) {
  obj.debits.forEach(side => Object.setPrototypeOf(side.amt, new Monum()));
  obj.credits.forEach(side => Object.setPrototypeOf(side.amt, new Monum()));
  return obj;
})

/** Global variables */
global.accountManager = new AccountManager(db.accounts, db);
global.transactionManager = new TransactionManager(db.transactions, db);

// for (let a of AccountManager.getInitialSetupData())
//   accountManager.createAccount(a)

/** Overmind */
const overmind = createOvermind(config, { devtools: true });

ReactDOM.render(
  <React.StrictMode>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
    <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width" />
    <CssBaseline />
    <SnackbarProvider maxSnack={5} autoHideDuration={2500} anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'center',
    }}>
      <MuiPickersUtilsProvider utils={DateFnsUtils}>
        <OverMindProvider value={overmind}>
          <App />
        </OverMindProvider>
      </MuiPickersUtilsProvider>
    </SnackbarProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
