import React, { Component} from 'react';

import Form from 'react-bootstrap/Form'
import FormControl from 'react-bootstrap/FormControl'

import { parseExpression, shouldShowPreview } from '../model/queryParser'

export default class SearchBar extends Component {
    constructor(props) {
        super(props);
        this.searchBar = React.createRef()
        this._debounce = null

        this.state = {
            inputValue: this.props.value || '',
        }
    }

    handleSearch(event) {
        event.preventDefault();
        clearTimeout(this._debounce)
        this.props.onSearch(this.searchBar.current.value.trim())
    }

    handleChange(event) {
        if(this.props.config.searchAutocompleteUnderdoth) {
            let regex = RegExp(/h\.\S/, 'i')
            this.searchBar.current.value = this.searchBar.current.value.replace(regex, (match, offset, string) => {return match.startsWith('h') ? `ḥ${string[offset+2]}` : `Ḥ${[offset+2]}` })
        }
        const value = this.searchBar.current.value
        this.setState({ inputValue: value })
        clearTimeout(this._debounce)
        this._debounce = setTimeout(() => this.props.onSearch(value.trim()), 200)
    }

    render() {
        const { color, regex, tags = [], loc } = this.props
        const { inputValue } = this.state

        let preview = null
        if (regex && inputValue.trim()) {
            const groups = parseExpression(inputValue, tags)
            if (groups && shouldShowPreview(groups)) {
                preview = groups
            }
        }

        return (
            <div className="search-input-wrapper">
                {color && (
                    <span className="search-color-dot" style={{ background: color }} />
                )}
                <Form onSubmit={this.handleSearch.bind(this)}>
                    <FormControl type="text" defaultValue={this.props.value} onChange={this.handleChange.bind(this)} placeholder={regex?loc.get("search_regex_placeholder"):loc.get("search_placeholder")} ref={this.searchBar} className={color ? 'has-color-dot' : ''}/>
                </Form>
                {preview && (
                    <div className="search-expr-preview">
                        {renderPreview(preview, loc)}
                    </div>
                )}
            </div>
            )
        }
    }

function renderPreview(groups, loc) {
    const elements = []
    groups.forEach((terms, gi) => {
        if (gi > 0) {
            elements.push(<span key={`or-${gi}`} className="search-expr-op">|</span>)
        }
        terms.forEach((term, ti) => {
            if (ti > 0) {
                elements.push(<span key={`and-${gi}-${ti}`} className="search-expr-op">&amp;</span>)
            }
            if (term.type === 'tag') {
                const label = loc.get(`tag_${term.key}`)
                elements.push(
                    <span key={`t-${gi}-${ti}`} className={`search-expr-tag${term.negated ? ' search-expr-tag--negated' : ''}`}>
                        {term.negated && <span className="search-expr-not">¬</span>}
                        {label}
                    </span>
                )
            } else {
                elements.push(
                    <span key={`r-${gi}-${ti}`} className="search-expr-text">
                        {term.negated && <span className="search-expr-not">¬</span>}
                        {term.pattern}
                    </span>
                )
            }
        })
    })
    return elements
}
