import React from 'react';
import ReactDOM from 'react-dom';

import { GoogleSpreadsheet } from 'google-spreadsheet';
import { GOOGLE_DOC_ID, GOOGLE_SHEET_ID, GOOGLE_SHEETS_API_KEY } from './staticData/googleCredentials'
import { buildRepositoryFrom } from './model/pointRepositoryFactory'

import App from './App';
import ConfigService from './model/configService'

const doc = new GoogleSpreadsheet(GOOGLE_DOC_ID);
async function login() {
  await doc.useApiKey(GOOGLE_SHEETS_API_KEY)
  console.log("Authentication: API key");
}

async function loadData() {
  await doc.loadInfo(); 
  console.log(`Datasource: loaded document ${doc.title}`);

  return await doc.sheetsById[GOOGLE_SHEET_ID]
}

function startApp(repository) {
  var config = new ConfigService()
  ReactDOM.render(
    // <React.StrictMode>
      <App config={config} repository={repository}/>,
    // </React.StrictMode>,
    document.getElementById('root')
  );
}

login().then(loadData().then(sheet => buildRepositoryFrom(sheet)).then(repository => startApp(repository)))

