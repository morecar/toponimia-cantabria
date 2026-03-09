import React from 'react';
import { createRoot } from 'react-dom/client';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'leaflet/dist/leaflet.css';

import App from './App';

import Configuration from './model/configuration'
import DataLoader from './model/dataLoader'
import JsonLoader from './model/jsonLoader'
import Localization from './model/localization'
import AttestationsStore from './model/attestationsStore'
import EtymologyStore from './model/etymologyStore'
import { buildRepositoryFromSheet, buildRepositoryFromLocalStorage } from './model/topoRepository'

const DATA_BASE = (process.env.REACT_APP_DATA_URL || `${process.env.PUBLIC_URL}/toponyms.json`)
  .replace(/toponyms\.json$/, '')

function startApp(repository, attestationsStore, etymologyStore) {
  var config = Configuration.readFromLocalStorage()
  var localization = Localization.createFromConfig(config)
  const root = createRoot(document.getElementById('root'));
  root.render(
    <App config={config} repository={repository} loc={localization}
         attestationsStore={attestationsStore} etymologyStore={etymologyStore}/>
  );
}

Promise.all([
  DataLoader.load()
    .then(data => data ? buildRepositoryFromSheet(data) : buildRepositoryFromLocalStorage())
    .catch(() => buildRepositoryFromLocalStorage()),
  new JsonLoader({
    dataUrl: `${DATA_BASE}attestations.json`,
    hashUrl: `${DATA_BASE}attestations-hash.json`,
    cacheKey: 'localAttestations',
  }).load().catch(() => []),
  new JsonLoader({
    dataUrl: `${DATA_BASE}etymologies.json`,
    hashUrl: `${DATA_BASE}etymologies-hash.json`,
    cacheKey: 'localEtymologies',
  }).load().catch(() => []),
]).then(([repository, attestationRows, etymologyRows]) =>
  startApp(repository, new AttestationsStore(attestationRows), new EtymologyStore(etymologyRows))
)
