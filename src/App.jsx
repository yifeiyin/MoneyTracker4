import React from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  Redirect,
} from "react-router-dom";

import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button
} from '@material-ui/core';

import ImportExportScreen from './screens/ImportExportScreen';
import AccountsScreen from './screens/AccountsScreen';
import TransactionsScreen from './screens/TransactionsScreen';
import DataManagementScreen from './screens/DataManagementScreen';

const routes = [
  ['/accounts', AccountsScreen, 'Accounts'],
  ['/data-management', DataManagementScreen, 'Data Management'],
  ['/import-export', ImportExportScreen, 'Import/Export'],
  ['/transactions', TransactionsScreen, 'Transactions'],
];

function App() {
  return (
    <Router>
      <Switch>
        <Route exact path='/'>
          <Redirect to='/data-management' />
        </Route>
        {
          routes.map(([path, Component, name]) =>
            <Route key={path} path={path}>
              <AppBarWrapper path={path} />
              <Component />
            </Route>
          )
        }
      </Switch>
    </Router>
  );
}


const AppBarWrapper = (props) => {
  return (
    <AppBar position="static" style={{ marginBottom: 20 }}>
      <Toolbar>
        {
          routes.map(([path, component, name]) =>
            <Link style={{ textDecoration: 'none', color: 'unset' }} key={path} to={path}>
              <Button
                color="inherit"
                style={{ border: path !== props.path ? '1px solid transparent' : '1px solid white' }}
              >{name}</Button>
            </Link>
          )
        }
        <span style={{ marginLeft: 'auto' }}>
          <Button color="inherit" onClick={() => global.loadInitialData()}>Reset</Button>
          <Button color="inherit" onClick={() => global.loadAllData()}>Reload</Button>
          <Button color="inherit" onClick={() => global.saveAllData()}>Save</Button>
        </span>
      </Toolbar>
    </AppBar>
  );
}

export default App;
