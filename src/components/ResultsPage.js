import React, { Component} from 'react';

import {Container, Navbar, Nav, NavItem, OverlayTrigger} from 'react-bootstrap';
import {Toggles} from 'react-bootstrap-icons';

import SearchBar from './SearchBar'
import SettingsTooltip from './SettingsTooltip'

import {BRAND_ALT, BRAND_NAME} from '../staticData/localization'
import ResultsMap from './ResultsMap';

export default class ResultsPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: this.props.searchBoxContents ? true : false,
      displayTags: (this.props.config.resultsTags === 'always') || (this.props.config.resultsTags === 'search' && this.props.searchBoxContents),
      displayLines: (this.props.config.resultsTypes.includes('line')),
      displayPolys: (this.props.config.resultsTypes.includes('poly')),
      displayPoints: (this.props.config.resultsTypes.includes('point')),
      retultsToDisplay: this.props.pointRepository.search(this.props.searchBoxContents)
    }
  }

  updateResults(searchString) {
    console.log(`searchstring=${searchString} => search=${searchString ? true : false}`)
    this.setState( {
      search: searchString ? true : false,
      displayTags: (this.props.config.resultsTags === 'always') || (this.props.config.resultsTags === 'search' && searchString ? true : false),
      retultsToDisplay: this.props.pointRepository.search(searchString, false)
    })
  }

  handleSettingsUpdated() {
    this.setState(
      {
        displayTags: (this.props.config.resultsTags === 'always') || (this.props.config.resultsTags === 'search' && this.state.search),
        displayLines: (this.props.config.resultsTypes.includes('line')),
        displayPolys: (this.props.config.resultsTypes.includes('poly')),
        displayPoints: (this.props.config.resultsTypes.includes('point')),
      }
    )
  }

  render() {
    const points = this.state.displayPoints ? this.state.retultsToDisplay.filter(point => point.type === 'point') : []
    const polys = this.state.displayPolys ? this.state.retultsToDisplay.filter(point => point.type === 'poly') : []
    const lines = this.state.displayLines ? this.state.retultsToDisplay.filter(point => point.type === 'line') : []
    return (
      <Container>
        <Navbar fixed="top"  bg="dark" expand="lg" variant="dark">
          <Navbar.Brand>
            <img src="./unicorn.png" alt={BRAND_ALT[this.props.config.language]}/>
          </Navbar.Brand>          
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mr-auto">
              <Navbar.Brand className={'main-brand'}>{BRAND_NAME[this.props.config.language]}</Navbar.Brand>
              <SearchBar onSearch={this.updateResults.bind(this)} tags={this.props.pointRepository.getAllTags()} {...this.props}/>
              <NavItem id="settings">
              <OverlayTrigger trigger="click" placement={'bottom'} overlay={<SettingsTooltip  onSettingsUpdated={this.handleSettingsUpdated.bind(this)} {...this.props}/>}> 
                  <Toggles style={{'fontSize': 'xx-large'}}/>
              </OverlayTrigger>
              </NavItem>
            </Nav>
          </Navbar.Collapse>
        </Navbar>
        <ResultsMap points={points} lines={lines} polys={polys} displayTags={this.state.displayTags} {...this.props}/>
      </Container>
    );
  }
}

