import './App.css';

import React from 'react';

import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";

import ResultsRoute from './components/routing/ResultsRoute'
import CaptureRoute from './components/routing/CaptureRoute'
import HomeRoute from './components/routing/HomeRoute'

import { ROUTE_HOME, ROUTE_CAPTURE, ROUTE_SEARCH, ROUTE_RESULT } from './resources/routes'

export default function App(props) {
    return (
        <Router basename={"/toponimia-cantabria"}>
            <Switch>
                <Route exact path={ROUTE_HOME} children={<HomeRoute {...props} />} />
                <Route path={ROUTE_CAPTURE} children={<CaptureRoute {...props} />} />
                <Route path={ROUTE_SEARCH} children={<ResultsRoute {...props} />} />
                <Route path={ROUTE_RESULT} children={<ResultsRoute {...props} />} />
            </Switch>
        </Router>
    )
}




