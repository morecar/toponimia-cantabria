import React, { Component} from 'react';

import Form from 'react-bootstrap/Form'
import Popover from 'react-bootstrap/Popover'

export default class SettingsTooltip extends Component {


    handleToggleChanged(event) {
        if(event.target.id === 'show-title-always' && event.target.checked) this.props.config.resultsTitle = 'always'
        if(event.target.id === 'show-title-search' && event.target.checked) this.props.config.resultsTitle = 'search'
        if(event.target.id === 'show-title-never' && event.target.checked) this.props.config.resultsTitle = 'never'

        if(event.target.id === 'show-tags-always' && event.target.checked) this.props.config.resultsTags = 'always'
        if(event.target.id === 'show-tags-search' && event.target.checked) this.props.config.resultsTags = 'search'
        if(event.target.id === 'show-tags-never' && event.target.checked) this.props.config.resultsTags = 'never'

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
                        <Form.Label><b>Veyer tupúnimu</b></Form.Label>
                        <div>
                            <Form.Check defaultChecked={this.props.config.resultsTitle === 'always'} label='Siempri' type='radio' id='show-title-always' name='showTitle' disabled/>
                            <Form.Check defaultChecked={this.props.config.resultsTitle === 'search'} label='In búsquedas' type='radio' id='show-title-search' name='showTitle' disabled/>
                            <Form.Check defaultChecked={this.props.config.resultsTitle === 'never'} label='In cliquiandu' type='radio' id='show-title-never' name='showTitle' disabled/>
                        </div>
                    </Form.Group>
                    <Form.Group onChange={this.handleToggleChanged.bind(this)}>
                        <Form.Label><b>Veyer etiquetas</b></Form.Label>
                        <div>   
                            <Form.Check defaultChecked={this.props.config.resultsTags === 'always'} label='Siempri' type='radio' id='show-tags-always' name='showTags'/>
                            <Form.Check defaultChecked={this.props.config.resultsTags === 'search'} label='In búsquedas' type='radio' id='show-tags-search' name='showTags'/>
                            <Form.Check defaultChecked={this.props.config.resultsTags === 'never'} label='Desactivás' type='radio' id='show-tags-never' name='showTags'/>
                            
                        </div>
                    </Form.Group>
                    <Form.Group onChange={this.handleToggleChanged.bind(this)}>
                        <Form.Label><b>Clas de resultáus</b></Form.Label>
                        <div>                          
                            <Form.Check inline defaultChecked={this.props.config.resultsTypes.includes('point')} label='Puntualis' type={'checkbox'} id={'toggle-points'} />
                            <Form.Check inline defaultChecked={this.props.config.resultsTypes.includes('line')} label='Linialis' type={'checkbox'} id={'toggle-lines'} disabled/>
                            <Form.Check inline defaultChecked={this.props.config.resultsTypes.includes('poly')} label='Zonalis' type={'checkbox'}  id={'toggle-polygons'} disabled/>
                        </div>
                    </Form.Group>
                    <Form.Group onChange={this.handleToggleChanged.bind(this)}>
                        <Form.Label><b>Otrus</b></Form.Label>
                        <Form.Check defaultChecked={this.props.config.searchAutocompleteUnderdoth} type='switch' id='toggle-underdoth' label='Detectar hachi supuntiá (h.→ḥ)'/>
                        <Form.Check defaultChecked={this.props.config.searchAutocompleteTags} type='switch' id='toggle-tag-auto' label='Autucompletar etiquetas' disabled/>
                        <Form.Check defaultChecked={this.props.config.searchDisplayTagPalette} type='switch' id='toggle-tag-palette' label='Veyer paleta etiquetas' disabled/>
                    </Form.Group>
                  </Form>
                </Popover.Content>
              </Popover>
        )
    }
}

