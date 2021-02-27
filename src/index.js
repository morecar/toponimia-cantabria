import React from 'react';
import ReactDOM from 'react-dom';

import App from './App';
import Configuration from './model/configuration'
import GSpreadsheet from './model/gSpreadsheet'
import { buildRepositoryFromSheet, buildRepositoryFromLocalStorage } from './model/pointRepositoryFactory'

function startApp(repository) {
  var config = Configuration.readFromLocalStorage()
  ReactDOM.render(
    // <React.StrictMode>
      <App config={config} repository={repository}/>,
    // </React.StrictMode>,
    document.getElementById('root')
  );
}

GSpreadsheet.load().then(buildRepositoryFromSheet, buildRepositoryFromLocalStorage).then(startApp)

