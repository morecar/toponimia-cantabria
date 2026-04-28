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
import BackofficeLandingPage from './components/BackofficeLandingPage'
import BackofficePage from './components/BackofficePage'
import AboutPage from './components/AboutPage'
import EtymologiesPage from './components/EtymologiesPage'
import ToponymsPage from './components/ToponymsPage'
import ErrorBoundary from './components/ErrorBoundary'

import { ROUTE_HOME, ROUTE_CAPTURE, ROUTE_SEARCH, ROUTE_RESULT, ROUTE_BACKOFFICE, ROUTE_BACKOFFICE_EDITOR, ROUTE_BACKOFFICE_EDITOR_VIEW, ROUTE_BACKOFFICE_EDITOR_SUBVIEW, ROUTE_ABOUT, ROUTE_ETYMOLOGIES, ROUTE_TOPONYMS } from './resources/routes'

export default function App(props) {
    return (
        <Router basename={"/toponimia-cantabria"}>
            <ErrorBoundary>
              <Routes>
                <Route path={ROUTE_HOME} element={<HomeRoute {...props} />} />
                <Route path={ROUTE_CAPTURE} element={<CaptureRoute {...props} />} />
                <Route path={ROUTE_SEARCH} element={<ResultsRoute {...props} />} />
                <Route path={ROUTE_RESULT} element={<ResultsRoute {...props} />} />
                <Route path={ROUTE_BACKOFFICE} element={<BackofficeLandingPage {...props} />} />
                <Route path={ROUTE_BACKOFFICE_EDITOR} element={<BackofficePage {...props} />} />
                <Route path={ROUTE_BACKOFFICE_EDITOR_VIEW}    element={<BackofficePage {...props} />} />
                <Route path={ROUTE_BACKOFFICE_EDITOR_SUBVIEW} element={<BackofficePage {...props} />} />
                <Route path={ROUTE_ABOUT} element={<AboutPage />} />
                <Route path={ROUTE_ETYMOLOGIES} element={<EtymologiesPage etymologyStore={props.etymologyStore} repository={props.repository} loc={props.loc} />} />
                <Route path={ROUTE_TOPONYMS} element={<ToponymsPage repository={props.repository} etymologyStore={props.etymologyStore} loc={props.loc} />} />
              </Routes>
            </ErrorBoundary>
        </Router>
    )
}
