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
  Button
} from '@material-ui/core';

import ImportScreen from './screens/ImportScreen';
import ImportExportScreen from './screens/ImportExportScreen';
import AccountsScreen from './screens/AccountsScreen';
import TransactionsScreen from './screens/TransactionsScreen';
import DataManagementScreen from './screens/DataManagementScreen';
import RulesScreen from './screens/RulesScreen';
import VisualizationScreen from './screens/VisualizationScreen';
import { useActions, useState } from './overmind';

const routes = [
  ['/accounts', AccountsScreen, 'Accounts'],
  ['/data-management', DataManagementScreen, 'Data Management'],
  ['/import', ImportScreen, 'Import'],
  ['/import-export', ImportExportScreen, 'Import/Export'],
  ['/transactions', TransactionsScreen, 'Transactions'],
  ['/rules', RulesScreen, 'Rules'],
  ['/visualization', VisualizationScreen, 'Visualization'],
];

function App() {
  const { isReady } = useState();
  const actions = useActions();

  React.useEffect(() => {
    actions.load();
  }, [actions]);

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
              {isReady ? <Component /> : <span>Loading</span>}
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
        {/* <span style={{ marginLeft: 'auto' }}>
          <Button color="inherit" onClick={() => global.loadInitialData()}>Reset</Button>
          <Button color="inherit" onClick={() => global.loadAllData()}>Reload</Button>
          <Button color="inherit" onClick={() => global.saveAllData()}>Save</Button>
        </span> */}
      </Toolbar>
    </AppBar>
  );
}

export default App;
