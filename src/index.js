import React from 'react';
import ReactDOM from 'react-dom';

import App from './App';

import Configuration from './model/configuration'
import GSpreadsheet from './model/gSpreadsheet'
import Localization from './model/localization'
import { buildRepositoryFromSheet, buildRepositoryFromLocalStorage } from './model/topoRepository'

function startApp(repository) {
  var config = Configuration.readFromLocalStorage()
  var localization = Localization.createFromConfig(config)
  ReactDOM.render(
    // <React.StrictMode>
      <App config={config} repository={repository} loc={localization}/>,
    // </React.StrictMode>,
    document.getElementById('root')
  );
}

GSpreadsheet.load().then(buildRepositoryFromSheet, buildRepositoryFromLocalStorage).then(startApp)

