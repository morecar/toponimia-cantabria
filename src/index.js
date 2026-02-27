import React from 'react';
import { createRoot } from 'react-dom/client';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'leaflet/dist/leaflet.css';

import App from './App';

import Configuration from './model/configuration'
import DataLoader from './model/dataLoader'
import Localization from './model/localization'
import { buildRepositoryFromSheet, buildRepositoryFromLocalStorage } from './model/topoRepository'

function startApp(repository) {
  var config = Configuration.readFromLocalStorage()
  var localization = Localization.createFromConfig(config)
  const root = createRoot(document.getElementById('root'));
  root.render(
    <App config={config} repository={repository} loc={localization}/>
  );
}

DataLoader.load()
  .then(data => data ? buildRepositoryFromSheet(data) : buildRepositoryFromLocalStorage())
  .catch(() => buildRepositoryFromLocalStorage())
  .then(startApp)
