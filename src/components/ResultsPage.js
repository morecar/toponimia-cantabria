import React, { Component} from 'react';

import {Container, Navbar, Nav, NavItem, OverlayTrigger} from 'react-bootstrap';
import {Toggles} from 'react-bootstrap-icons';

import SearchBar from './SearchBar'
import SettingsPopover from './SettingsPopover'

import ResultsMap from './ResultsMap';
import LanguageSelector from './LanguageSelector';

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
      locale: this.props.loc.locale,
      //Displayed content
      queryString: queryString,
      queryResults: queryResults,
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

  handleChangeLanguage(event) {
    if(this.props.loc.availableLocales.includes(event.target.id)) {
      this.props.loc.locale = event.target.id
      this.setState( {locale: event.target.id})
    }
  }

  render() {
    const points = this.state.displayPoints ? this.state.queryResults.filter(point => point.type === 'point') : []
    const polys = this.state.displayPolys ? this.state.queryResults.filter(point => point.type === 'poly') : []
    const lines = this.state.displayLines ? this.state.queryResults.filter(point => point.type === 'line') : []

    return (
      <Container>
        <Navbar fixed="top"  bg="dark" expand="lg" variant="dark">
          <Navbar.Brand>
            <img src="./unicorn.png" alt={this.props.loc.get("brand_alt")}/>
          </Navbar.Brand> 
          <Navbar.Brand className={'main-brand'}>{this.props.loc.get("brand_name")}</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />        
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mr-auto">
              <SearchBar onSearch={this.updateResults.bind(this)} value={this.state.queryString} tags={this.props.repository.getAllTags()} regex={this.state.useRegex} {...this.props}/>

            </Nav>
            <LanguageSelector onLanguageChanged={this.handleChangeLanguage.bind(this)} title={this.props.loc.get(this.state.locale)} {...this.props} />
            <NavItem id="settings">
              <OverlayTrigger trigger="click" placement={'bottom'} overlay={<SettingsPopover  onSettingsUpdated={this.handleSettingsUpdated.bind(this)} {...this.props}/>} rootClose> 
                  <Toggles style={{'fontSize': 'xx-large'}}/>
              </OverlayTrigger>
              </NavItem>  
          </Navbar.Collapse>
        </Navbar>
        <ResultsMap points={points} lines={lines} polys={polys} displayTags={this.state.displayTags} {...this.props}/>
      </Container>
    );
  }
}

