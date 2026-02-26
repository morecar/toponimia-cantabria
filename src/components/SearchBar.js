import React, { Component} from 'react';
import {generatePath} from 'react-router-dom'

import Form from 'react-bootstrap/Form'
import FormControl from 'react-bootstrap/FormControl'

import {ROUTE_SEARCH_PATTERN, ROUTE_HOME} from '../resources/routes'

export default class SearchBar extends Component {
    constructor(props) {
        super(props);
        this.searchBar = React.createRef()

        this.state = {
            tags: [],
            rawQuery: "",
            searchString: this.props.queryString
        }
    }

    handleSearch(event) {
        event.preventDefault();
        var query = this.searchBar.current.value.trim()
        const url = query === ""
                    ? generatePath(ROUTE_HOME)
                    : generatePath(ROUTE_SEARCH_PATTERN, {query: encodeURIComponent(query)})
        this.props.history(url)
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
            <Form onSubmit={this.handleSearch.bind(this)}>
                <FormControl type="text" defaultValue={this.props.value} onChange={this.handleChange.bind(this)} placeholder={this.props.regex?this.props.loc.get("search_regex_placeholder"):this.props.loc.get("search_placeholder")} ref={this.searchBar}/>
            </Form>
            )
        }
    }
