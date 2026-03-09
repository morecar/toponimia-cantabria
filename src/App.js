import './App.css';

import React from 'react';

import {
  BrowserRouter as Router,
  Routes,
  Route
} from "react-router-dom";

import ResultsRoute from './components/routing/ResultsRoute'
import CaptureRoute from './components/routing/CaptureRoute'
import HomeRoute from './components/routing/HomeRoute'
import BackofficeRoute from './components/routing/BackofficeRoute'

import { ROUTE_HOME, ROUTE_CAPTURE, ROUTE_SEARCH, ROUTE_RESULT, ROUTE_BACKOFFICE } from './resources/routes'

export default function App(props) {
    return (
        <Router basename={"/toponimia-cantabria"}>
            <Routes>
                <Route path={ROUTE_HOME} element={<HomeRoute {...props} />} />
                <Route path={ROUTE_CAPTURE} element={<CaptureRoute {...props} />} />
                <Route path={ROUTE_SEARCH} element={<ResultsRoute {...props} />} />
                <Route path={ROUTE_RESULT} element={<ResultsRoute {...props} />} />
                <Route path={ROUTE_BACKOFFICE} element={<BackofficeRoute {...props} />} />
            </Routes>
        </Router>
    )
}
