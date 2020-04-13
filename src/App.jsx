import React from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
} from "react-router-dom";

import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button
} from '@material-ui/core';

import ImportExportScreen from './screens/ImportExportScreen';

function App() {
  return (
    <Router>
      <AppBar position="static">
        <Toolbar>
          <Button color="inherit" href="/">Home</Button>
          <Button color="inherit" href="/import-export">Import Export</Button>
          <Button color="inherit" href="/users">Users</Button>
        </Toolbar>
      </AppBar>


      {/* A <Switch> looks through its children <Route>s and
              renders the first one that matches the current URL. */}
      <Switch>
        <Route path="/import-export">
          <ImportExportScreen />
        </Route>
        <Route path="/users">
          <h1>Users</h1>
        </Route>
        <Route path="/">
          <h1>Home</h1>
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
