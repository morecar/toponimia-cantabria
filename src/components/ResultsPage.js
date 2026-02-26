import React, { Component } from 'react';

import {Container, Navbar} from 'react-bootstrap';

import {List} from 'react-bootstrap-icons';

import SearchBar from './SearchBar'
import SettingsPopover from './SettingsPopover'

import ResultsMap from './ResultsMap';

function buildResults(props) {
  if(!props.search) {
    return {queryString:"",  queryResults: props.repository.getFromQueryString("")}
  }

  if(props.wordId) {
    const singleResult = props.repository.getFromId(props.wordId) ?? {queryString: "", queryResults: []}
    return {queryString: singleResult.title, queryResults: [singleResult]}
  }

  return {queryString: props.queryString,  queryResults: props.repository.getFromQueryString(props.queryString)}
}

export default class ResultsPage extends Component {
  constructor(props) {
    super(props);
    const {queryString, queryResults} = buildResults(props)
    this.state = {
      //Displayed content
      queryString: queryString,
      queryResults: queryResults,
      showSettings: false,
      //Results from settings
      displayTags: (props.config.resultsTags === 'always') || (props.config.resultsTags === 'search' && props.search),
      displayLines: (props.config.resultsTypes.includes('line')),
      displayPolys: (props.config.resultsTypes.includes('poly')),
      displayPoints: (props.config.resultsTypes.includes('point')),
      useRegex: props.config.searchUseRegex
    }
  }

  updateResults(newQueryString) {
    this.setState( {
      queryString: newQueryString,
      queryResults: this.props.repository.getFromQueryString(newQueryString, this.props.config.searchUseRegex),
      displayTags: (this.props.config.resultsTags === 'always') || (this.props.config.resultsTags === 'search' && newQueryString ? true : false)
    })
  }

  handleSettingsUpdated() {
    this.setState(
      {
        displayTags: (this.props.config.resultsTags === 'always') || (this.props.config.resultsTags === 'search' && this.state.search),
        displayLines: (this.props.config.resultsTypes.includes('line')),
        displayPolys: (this.props.config.resultsTypes.includes('poly')),
        displayPoints: (this.props.config.resultsTypes.includes('point')),
        useRegex: this.props.config.searchUseRegex
      }
    )
  }

  render() {
    const points = this.state.displayPoints ? this.state.queryResults.filter(point => point.type === 'point') : []
    const polys = this.state.displayPolys ? this.state.queryResults.filter(point => point.type === 'poly') : []
    const lines = this.state.displayLines ? this.state.queryResults.filter(point => point.type === 'line') : []

    return (
      <Container>
        <Navbar fixed="top" bg="dark" variant="dark">
          <div className="navbar-brand-center">
            <Navbar.Brand>
              <img src={process.env.PUBLIC_URL + '/unicorn.png'} alt={this.props.loc.get("brand_alt")}/>
            </Navbar.Brand>
            <Navbar.Brand className={'main-brand'}>{this.props.loc.get("brand_name")}</Navbar.Brand>
          </div>
          <button
            className="settings-toggle ms-auto"
            onClick={() => this.setState(s => ({showSettings: !s.showSettings}))}
          >
            <List/>
          </button>
        </Navbar>
        {this.state.showSettings && (
          <div className="settings-panel">
            <SettingsPopover
              onSettingsUpdated={this.handleSettingsUpdated.bind(this)}
              config={this.props.config}
              loc={this.props.loc}
            />
          </div>
        )}
        <div className="search-wrapper">
          <SearchBar
            onSearch={this.updateResults.bind(this)}
            value={this.state.queryString}
            tags={this.props.repository.getAllTags()}
            regex={this.state.useRegex}
            config={this.props.config}
            loc={this.props.loc}
            history={this.props.history}
          />
        </div>
        <ResultsMap points={points} lines={lines} polys={polys} displayTags={this.state.displayTags} loc={this.props.loc}/>
      </Container>
    );
  }
}
