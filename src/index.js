import React from 'react';
import ReactDOM from 'react-dom';

import App from './App';
import ConfigService from './model/configService'

import { buildRepositoryFromSheet } from './model/pointRepositoryFactory'
import { connectToSpreadSheet } from './model/googleSheetsClient'


function startApp(repository) {
  var config = new ConfigService()
  ReactDOM.render(
    // <React.StrictMode>
      <App config={config} repository={repository}/>,
    // </React.StrictMode>,
    document.getElementById('root')
  );
}

connectToSpreadSheet().then(buildRepositoryFromSheet).then(startApp)

