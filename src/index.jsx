import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import * as serviceWorker from './serviceWorker';

/** CSS */
import './index.css';
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
import CheckpointManager from './newCore/checkpoints';

/** Database setup */
const db = new Dexie('MyDatabase');
db.version(11).stores({
  accounts: '++id, name, parentId',
  transactions: '++id, time, title, *_debits, *_credits, *_debitsCredits, *tags',
  checkpoints: 'time, *_accounts',
});

/** Database hooks for transactions */
db.transactions.hook('reading', function (obj) {
  obj.debits.forEach(side => Object.setPrototypeOf(side.amt, new Monum()));
  obj.credits.forEach(side => Object.setPrototypeOf(side.amt, new Monum()));
  delete obj._debits;
  delete obj._credits;
  delete obj._debitsCredits;
  return obj;
});

db.transactions.hook('creating', function (primKey, obj, transaction) {
  obj._debits = obj.debits.map(({ acc }) => global.accountManager.getPath(acc));
  obj._credits = obj.credits.map(({ acc }) => global.accountManager.getPath(acc));
  obj._debitsCredits = [...obj._debits, ...obj._credits];
});

db.transactions.hook('updating', function (modifications, primKey, obj, transaction) {
  const additionalModifications = {};
  if ('debits' in modifications || 'credits' in modifications) {
    additionalModifications._debits = (modifications.debits || obj.debits).map(({ acc }) => global.accountManager.getPath(acc));
    additionalModifications._credits = (modifications.credits || obj.credits).map(({ acc }) => global.accountManager.getPath(acc));
    additionalModifications._debitsCredits = [...additionalModifications._debits, additionalModifications._credits];
  }
  return additionalModifications;
});

/** Database hooks for checkpoints */
db.checkpoints.hook('reading', function (obj) {
  obj.balances.forEach(balance => Object.setPrototypeOf(balance.amt, new Monum()));
  delete obj._accounts;
  return obj;
});

db.checkpoints.hook('creating', function (primKey, obj, transaction) {
  obj._accounts = obj.balances.map(balance => balance.acc);
});

db.checkpoints.hook('updating', function (modifications, primKey, obj, transaction) {
  /**
   * Only handling the hidden column for internal indexing purposes.
   * The outside should ensure the correctness of values of the checkpoints.
   */
  const additionalModifications = {};
  if ('balances' in modifications) {
    additionalModifications._accounts = obj.balances.map(balance => balance.acc);
  }
  return additionalModifications;
});


/** Global variables */
global.accountManager = new AccountManager(db.accounts, db);
global.transactionManager = new TransactionManager(db.transactions, db);
global.checkpointManager = new CheckpointManager(db.checkpoints, db);
global.checkpointManager.transactionManager = global.transactionManager
global.checkpointManager.accountManager = global.accountManager
global.transactionManager.checkpointManager = global.checkpointManager

global.categories = JSON.parse(localStorage.getItem('categories') || '{}')


global.getReady = async () => {
  if ((await db.accounts.count()) === 0)
    for (let a of AccountManager.getInitialSetupData())
      await global.accountManager.create(a)

  if ((await db.transactions.count()) === 0)
    for (let a of TransactionManager.getInitialSetupData())
      await global.transactionManager.create(a)

  await global.accountManager.getReady();
}

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
