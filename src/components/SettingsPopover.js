import React, { Component, Fragment} from 'react';

import Form from 'react-bootstrap/Form'
import Popover from 'react-bootstrap/Popover'

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
        const { repository, searchBoxContents, onSettingsUpdated, ...popOverProps} = this.props
        return (         
              <Popover {...popOverProps}>
                <Popover.Content>
                  <Form>
                    <Form.Group onChange={this.handleToggleChanged.bind(this)}>
                        <Form.Label><b>{this.props.loc.get("show_title")}</b></Form.Label>
                        <Fragment>
                            <Form.Check defaultChecked={this.props.config.resultsTitle === 'always'} label={this.props.loc.get("toggle_always")} type='radio' id='show-title-always' name='showTitle' disabled/>
                            <Form.Check defaultChecked={this.props.config.resultsTitle === 'search'} label={this.props.loc.get("toggle_search")} type='radio' id='show-title-search' name='showTitle' disabled/>
                            <Form.Check defaultChecked={this.props.config.resultsTitle === 'click'}  label={this.props.loc.get("toggle_click")}  type='radio' id='show-title-click'  name='showTitle' disabled/>
                        </Fragment>
                    </Form.Group>
                    <Form.Group onChange={this.handleToggleChanged.bind(this)}>
                    <Form.Label><b>{this.props.loc.get("show_tags")}</b></Form.Label>
                        <Fragment>   
                            <Form.Check defaultChecked={this.props.config.resultsTags === 'always'} label={this.props.loc.get("toggle_always")} type='radio' id='show-tags-always' name='showTags'/>
                            <Form.Check defaultChecked={this.props.config.resultsTags === 'search'} label={this.props.loc.get("toggle_search")} type='radio' id='show-tags-search' name='showTags'/>
                            <Form.Check defaultChecked={this.props.config.resultsTags === 'click'}  label={this.props.loc.get("toggle_click")}  type='radio' id='show-tags-click'  name='showTags'/>                         
                        </Fragment>
                    </Form.Group>
                    <Form.Group onChange={this.handleToggleChanged.bind(this)}>
                    <Form.Label><b>{this.props.loc.get("result_class")}</b></Form.Label>
                        <div>                          
                            <Form.Check inline defaultChecked={this.props.config.resultsTypes.includes('point')} label={this.props.loc.get("result_class_point")} type={'checkbox'} id={'toggle-points'}/>
                            <Form.Check inline defaultChecked={this.props.config.resultsTypes.includes('line')}  label={this.props.loc.get("result_class_line")}  type={'checkbox'} id={'toggle-lines'} disabled/>
                            <Form.Check inline defaultChecked={this.props.config.resultsTypes.includes('poly')}  label={this.props.loc.get("result_class_poly")}  type={'checkbox'} id={'toggle-polygons'} disabled/>
                        </div>
                    </Form.Group>
                    <Form.Group onChange={this.handleToggleChanged.bind(this)}>
                        <Form.Label><b>{this.props.loc.get("settings_category_other")}</b></Form.Label>
                        <Form.Check defaultChecked={this.props.config.searchUseRegex}               type='switch' id='toggle-regex'       label={this.props.loc.get("toogle_search_regex")}/>
                        <Form.Check defaultChecked={this.props.config.searchAutocompleteUnderdoth}  type='switch' id='toggle-underdoth'   label={this.props.loc.get("toogle_detect_underdoth")}/>
                        <Form.Check defaultChecked={this.props.config.searchAutocompleteTags}       type='switch' id='toggle-tag-auto'    label={this.props.loc.get("toogle_search_tags_autocomplete")} disabled/>
                        <Form.Check defaultChecked={this.props.config.searchDisplayTagPalette}      type='switch' id='toggle-tag-palette' label={this.props.loc.get("toogle_search_tags_palette")} disabled/>
                    </Form.Group>
                  </Form>
                </Popover.Content>
              </Popover>
        )
    }
}
