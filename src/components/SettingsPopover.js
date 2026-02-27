import React, { Component } from 'react';

import Form from 'react-bootstrap/Form'

export default class SettingsPopover extends Component {

    handleToggleChanged(event) {
        if(event.target.id === 'show-title-always' && event.target.checked) this.props.config.resultsTitle = 'always'
        if(event.target.id === 'show-title-search' && event.target.checked) this.props.config.resultsTitle = 'search'
        if(event.target.id === 'show-title-click' && event.target.checked) this.props.config.resultsTitle = 'click'

        if(event.target.id === 'show-tags-always' && event.target.checked) this.props.config.resultsTags = 'always'
        if(event.target.id === 'show-tags-search' && event.target.checked) this.props.config.resultsTags = 'search'
        if(event.target.id === 'show-tags-click' && event.target.checked) this.props.config.resultsTags = 'click'

        if(event.target.id === 'toggle-points')
            this.props.config.resultsTypes =  event.target.checked
                                                    ? Array.from(new Set(this.props.config.resultsTypes).add('point'))
                                                    : this.props.config.resultsTypes.filter(e => e!=='point')

        if(event.target.id === 'toggle-lines')
            this.props.config.resultsTypes =  event.target.checked
                                                    ? Array.from(new Set(this.props.config.resultsTypes).add('line'))
                                                    : this.props.config.resultsTypes.filter(e => e!=='line')

        if(event.target.id === 'toggle-polygons')
            this.props.config.resultsTypes =  event.target.checked
                                                    ? Array.from(new Set(this.props.config.resultsTypes).add('poly'))
                                                    : this.props.config.resultsTypes.filter(e => e!=='poly')

        if(event.target.id === 'toggle-regex') this.props.config.searchUseRegex = event.target.checked
        if(event.target.id === 'toggle-underdoth') this.props.config.searchAutocompleteUnderdoth = event.target.checked
        if(event.target.id === 'toggle-tag-auto') this.props.config.searchAutocompleteTags = event.target.checked
        if(event.target.id === 'toggle-tag-palette') this.props.config.searchDisplayTagPalette = event.target.checked

        this.props.onSettingsUpdated()
    }

    render() {
        return (
          <>
          <Form className="settings-form" onChange={this.handleToggleChanged.bind(this)}>
            <div className="row g-3">
              <div className="col-6 col-md-3">
                <Form.Group>
                  <Form.Label><b>{this.props.loc.get("show_title")}</b></Form.Label>
                  <Form.Check defaultChecked={this.props.config.resultsTitle === 'always'} label={this.props.loc.get("toggle_always")} type='radio' id='show-title-always' name='showTitle' disabled/>
                  <Form.Check defaultChecked={this.props.config.resultsTitle === 'search'} label={this.props.loc.get("toggle_search")} type='radio' id='show-title-search' name='showTitle' disabled/>
                  <Form.Check defaultChecked={this.props.config.resultsTitle === 'click'}  label={this.props.loc.get("toggle_click")}  type='radio' id='show-title-click'  name='showTitle' disabled/>
                </Form.Group>
              </div>
              <div className="col-6 col-md-3">
                <Form.Group>
                  <Form.Label><b>{this.props.loc.get("show_tags")}</b></Form.Label>
                  <Form.Check defaultChecked={this.props.config.resultsTags === 'always'} label={this.props.loc.get("toggle_always")} type='radio' id='show-tags-always' name='showTags'/>
                  <Form.Check defaultChecked={this.props.config.resultsTags === 'search'} label={this.props.loc.get("toggle_search")} type='radio' id='show-tags-search' name='showTags'/>
                  <Form.Check defaultChecked={this.props.config.resultsTags === 'click'}  label={this.props.loc.get("toggle_click")}  type='radio' id='show-tags-click'  name='showTags'/>
                </Form.Group>
              </div>
              <div className="col-6 col-md-3">
                <Form.Group>
                  <Form.Label><b>{this.props.loc.get("result_class")}</b></Form.Label>
                  <Form.Check defaultChecked={this.props.config.resultsTypes.includes('point')} label={this.props.loc.get("result_class_point")} type='checkbox' id='toggle-points'/>
                  <Form.Check defaultChecked={this.props.config.resultsTypes.includes('line')}  label={this.props.loc.get("result_class_line")}  type='checkbox' id='toggle-lines'/>
                  <Form.Check defaultChecked={this.props.config.resultsTypes.includes('poly')}  label={this.props.loc.get("result_class_poly")}  type='checkbox' id='toggle-polygons'/>
                </Form.Group>
              </div>
              <div className="col-6 col-md-3">
                <Form.Group>
                  <Form.Label><b>{this.props.loc.get("settings_category_other")}</b></Form.Label>
                  <Form.Check defaultChecked={this.props.config.searchUseRegex}               type='switch' id='toggle-regex'       label={this.props.loc.get("toogle_search_regex")}/>
                  <Form.Check defaultChecked={this.props.config.searchAutocompleteUnderdoth}  type='switch' id='toggle-underdoth'   label={this.props.loc.get("toogle_detect_underdoth")}/>
                  <Form.Check defaultChecked={this.props.config.searchAutocompleteTags}       type='switch' id='toggle-tag-auto'    label={this.props.loc.get("toogle_search_tags_autocomplete")} disabled/>
                  <Form.Check defaultChecked={this.props.config.searchDisplayTagPalette}      type='switch' id='toggle-tag-palette' label={this.props.loc.get("toogle_search_tags_palette")} disabled/>
                </Form.Group>
              </div>
            </div>
          </Form>
          {process.env.NODE_ENV === 'development' && (
            <button
              style={{marginTop:'0.5rem', marginBottom:'0.5rem', background:'red', color:'white', border:'3px dashed yellow', fontWeight:'bold', padding:'4px 10px', cursor:'pointer'}}
              onClick={() => { localStorage.clear(); window.location.reload() }}
            >
              ☢ CLEAR CACHE ☢
            </button>
          )}
          </>
        )
    }
}
