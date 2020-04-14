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
console.log('Loading new app instance');
global.accountManager = new AccountManager(JSON.stringify(require('./Accounts.json')));


ReactDOM.render(
  <React.StrictMode>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
    <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width" />
    <CssBaseline />
    {/* <Provider store={store}> */}
    <SnackbarProvider maxSnack={5} anchorOrigin={{
      vertical: 'top',
      horizontal: 'right',
    }}>
      <App />
    </SnackbarProvider>
    {/* </Provider> */}
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
