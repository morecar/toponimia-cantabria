import React, { Component} from 'react';

import Form from 'react-bootstrap/Form'
import FormControl from 'react-bootstrap/FormControl'

import {SEARCH_PLACEHOLDER} from '../staticData/localization'

export default class SearchBar extends Component {
    constructor(props) {
      super(props);
      this.searchBar = React.createRef()
  
      this.state = {
        tags: [],
        rawQuery: "",
        searchString: this.props.searchBoxContents
      }
    }
    
    handleSearch(event) {
        event.preventDefault();
        var query = this.searchBar.current.value.trim()
        this.props.onSearch(query)
    }

    handleChange(event) {
        if(this.props.config.searchAutocompleteUnderdoth) {
            let regex = RegExp(/h\.\S/, 'i')
            this.searchBar.current.value = this.searchBar.current.value.replace(regex, (match, offset, string) => {return match.startsWith('h') ? `ḥ${string[offset+2]}` : `Ḥ${[offset+2]}` })
        }
    }

    render() {
        return (
            <div>
                <Form inline onSubmit={this.handleSearch.bind(this)}>
                    <FormControl type="text" onChange={this.handleChange.bind(this)} placeholder={SEARCH_PLACEHOLDER[this.props.config.language]} ref={this.searchBar}/>
                </Form>
            </div>
        )
    }
}