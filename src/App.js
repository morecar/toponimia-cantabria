import './App.css';

import React from 'react';

import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";

import ResultsPage from './components/ResultsPage'
import CaptureMap from './components/CaptureMap'

import {ROUTE_HOME, ROUTE_CAPTURE} from './staticData/localization.js'

export default function App(props) {
    return (
        <Router>
            <Switch>
                <Route path={ROUTE_CAPTURE} children={<CaptureMap repository={props.repository} {...props} />} />
                <Route path={ROUTE_HOME} children={<ResultsPage repository={props.repository} searchBoxContents={""} {...props} />} />
            </Switch>
        </Router>
    )
}




