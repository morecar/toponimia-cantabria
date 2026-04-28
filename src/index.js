import React from 'react';
import { createRoot } from 'react-dom/client';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'leaflet/dist/leaflet.css';

import App from './App';

import Configuration from './model/configuration'
import DataLoader from './model/dataLoader'
import JsonLoader from './model/jsonLoader'
import Localization from './model/localization'
import EtymologyStore from './model/etymologyStore'
import { buildRepositoryFromSheet, buildRepositoryFromLocalStorage } from './model/topoRepository'

function startApp(repository, etymologyStore) {
  var config = Configuration.readFromLocalStorage()
  var localization = Localization.createFromConfig(config)
  const root = createRoot(document.getElementById('root'));
  root.render(
    <App config={config} repository={repository} loc={localization}
         etymologyStore={etymologyStore}/>
  );
}

Promise.all([
  DataLoader.load()
    .then(data => data ? buildRepositoryFromSheet(data) : buildRepositoryFromLocalStorage())
    .catch(() => buildRepositoryFromLocalStorage()),
  new JsonLoader({
    dataUrl: import.meta.env.REACT_APP_ETYMOLOGIES_URL || `${import.meta.env.BASE_URL}etymologies.json`,
    hashUrl: import.meta.env.REACT_APP_ETYMOLOGIES_HASH_URL || `${import.meta.env.BASE_URL}etymologies-hash.json`,
    cacheKey: 'localEtymologies',
  }).load().catch(() => []),
]).then(([repository, etymologyRows]) => {
  const etymologyStore = new EtymologyStore(etymologyRows)
  repository.etymologyStore = etymologyStore
  startApp(repository, etymologyStore)
})
