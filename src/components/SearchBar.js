import React, { Component } from 'react'
import { Tags } from 'react-bootstrap-icons'
import { parseExpression, shouldShowPreview, normalizeQuery } from '../model/queryParser'

function tagCategoryClass(tagKey) {
    const prefix = tagKey.split(':')[0]
    return `tag-chip--cat-${prefix}`
}

export default class SearchBar extends Component {
    constructor(props) {
        super(props)
        this.editorRef = React.createRef()
        this._blurTimeout = null
        this.state = { showPalette: false, showOperators: false }
    }

    componentDidMount() {
        if (this.props.value) this._renderTokens(this.props.value)
    }

    // Extract raw query string from DOM (text nodes + chip data-raw attributes)
    _getRawText() {
        const el = this.editorRef.current
        if (!el) return ''
        let raw = ''
        const walk = node => {
            if (node.nodeType === 3) raw += node.textContent
            else if (node.dataset?.raw != null) raw += node.dataset.raw
            else node.childNodes.forEach(walk)
        }
        el.childNodes.forEach(walk)
        return raw
    }

    // Get cursor position as character offset in raw text
    _getCursor() {
        const sel = window.getSelection()
        if (!sel?.rangeCount) return null
        const range = sel.getRangeAt(0)
        const el = this.editorRef.current
        if (!el?.contains(range.startContainer)) return null
        let offset = 0, found = false
        const walk = node => {
            if (found) return
            if (node === range.startContainer && node.nodeType === 3) {
                offset += range.startOffset; found = true; return
            }
            if (node.nodeType === 3) { offset += node.textContent.length; return }
            if (node.dataset?.raw != null) {
                if (node === range.startContainer) { found = true; return }
                offset += node.dataset.raw.length; return
            }
            node.childNodes.forEach(walk)
        }
        el.childNodes.forEach(walk)
        return found ? offset : null
    }

    // Restore cursor to character offset in raw text
    _setCursor(target) {
        const el = this.editorRef.current
        if (!el) return
        el.focus()
        let rem = target, placed = false
        const place = node => {
            if (placed) return
            if (node.nodeType === 3) {
                const len = node.textContent.length
                if (rem <= len) {
                    const r = document.createRange()
                    r.setStart(node, rem); r.collapse(true)
                    const s = window.getSelection()
                    s.removeAllRanges(); s.addRange(r)
                    placed = true
                } else { rem -= len }
            } else if (node.dataset?.raw != null) {
                const len = node.dataset.raw.length
                if (rem <= len) {
                    // place cursor in the trailing text node after the chip
                    const next = node.nextSibling
                    if (next && next.nodeType === 3) {
                        const r = document.createRange()
                        r.setStart(next, 0); r.collapse(true)
                        const s = window.getSelection()
                        s.removeAllRanges(); s.addRange(r)
                    } else {
                        const r = document.createRange()
                        r.setStartAfter(node); r.collapse(true)
                        const s = window.getSelection()
                        s.removeAllRanges(); s.addRange(r)
                    }
                    placed = true
                } else { rem -= len }
            } else {
                node.childNodes.forEach(place)
            }
        }
        el.childNodes.forEach(place)
        if (!placed) {
            const r = document.createRange()
            r.selectNodeContents(el); r.collapse(false)
            const s = window.getSelection()
            s.removeAllRanges(); s.addRange(r)
        }
    }

    // Re-render editor content as tokens (chips + plain text)
    _renderTokens(rawText) {
        const el = this.editorRef.current
        if (!el) return
        const { tags = [], loc } = this.props
        // Normalize operators so && → ' & ' and || → ' | '
        const src = normalizeQuery(rawText)
        const groups = src.trim() ? parseExpression(src, tags) : null
        const frag = document.createDocumentFragment()

        if (groups && shouldShowPreview(groups)) {
            // Reconstruct canonical text to detect any trailing suffix not yet parsed
            const canonical = groups
                .map(g => g.map(t => (t.negated ? '! ' : '') + (t.type === 'tag' ? t.key : t.pattern)).join(' & '))
                .join(' | ')
            const suffix = src.slice(canonical.length)
            let lastWasChip = false
            groups.forEach((terms, gi) => {
                if (gi > 0) { frag.appendChild(document.createTextNode(' | ')); lastWasChip = false }
                terms.forEach((term, ti) => {
                    if (ti > 0) { frag.appendChild(document.createTextNode(' & ')); lastWasChip = false }
                    if (term.type === 'tag') {
                        const chip = document.createElement('span')
                        chip.contentEditable = 'false'
                        chip.dataset.raw = (term.negated ? '! ' : '') + term.key
                        chip.className = `tag-chip ${tagCategoryClass(term.key)}${term.negated ? ' tag-chip--negated' : ''}`
                        chip.textContent = (term.negated ? '¬ ' : '') + (loc.get(`tag_${term.key}`) || term.key)
                        frag.appendChild(chip)
                        frag.appendChild(document.createTextNode(''))
                        lastWasChip = true
                    } else {
                        frag.appendChild(document.createTextNode((term.negated ? '! ' : '') + term.pattern))
                        lastWasChip = false
                    }
                })
            })
            // Preserve any trailing input not yet parsed into a complete term
            if (suffix) {
                frag.appendChild(document.createTextNode(suffix))
                lastWasChip = false
            }
            // When a chip is last, give its trailing text node a space so the cursor is visible
            if (lastWasChip && frag.lastChild) frag.lastChild.textContent = ' '
        } else {
            frag.appendChild(document.createTextNode(src))
        }

        el.innerHTML = ''
        el.appendChild(frag)
    }

    // Get the partial token at cursor (the word being typed)
    _getCurrentToken(rawText, cursor) {
        if (cursor == null) return ''
        const before = rawText.slice(0, cursor)
        const match = before.match(/[^\s|&!]+$/)
        return match ? match[0] : ''
    }

    handleInsertOperator(op) {
        const rawText = this._getRawText()
        const cursor = this._getCursor() ?? rawText.length
        const newRaw = rawText.slice(0, cursor) + op + rawText.slice(cursor)
        this._renderTokens(newRaw)
        this._setCursor(cursor + op.length)
        this.setState({ showOperators: false })
        this.props.onSearch(newRaw.trim())
    }

    handleInput() {
        let rawText = this._getRawText()

        if (this.props.config.searchAutocompleteUnderdoth) {
            rawText = rawText.replace(/h\.([\S])/gi, (m, c) => m[0] === 'h' ? `ḥ${c}` : `Ḥ${c}`)
        }

        const cursor = this._getCursor()
        this._renderTokens(rawText)
        if (cursor != null) this._setCursor(cursor)
        this.setState({ showOperators: false })
    }

    _deleteLastChip() {
        const el = this.editorRef.current
        if (!el) return false
        // Find the last chip in the editor
        let lastChip = null
        const walk = node => {
            if (node.dataset?.raw != null) lastChip = node
            else node.childNodes.forEach(walk)
        }
        el.childNodes.forEach(walk)
        if (!lastChip) return false
        const beforeChip = lastChip.previousSibling
        const afterChip = lastChip.nextSibling
        if (beforeChip?.nodeType === 3) beforeChip.remove()
        if (afterChip?.nodeType === 3) afterChip.remove()
        lastChip.remove()
        const newRaw = this._getRawText().trim()
        this._renderTokens(newRaw)
        this._setCursor(newRaw.length)
        this.props.onSearch(newRaw.trim())
        return true
    }

    handleKeyDown(e) {
        if (e.key === 'Backspace') {
            const sel = window.getSelection()
            if (sel?.rangeCount && sel.getRangeAt(0).collapsed) {
                const range = sel.getRangeAt(0)
                const node = range.startContainer
                const el = this.editorRef.current
                // Case 1: cursor in text node right after a chip
                if (node.nodeType === 3 && el?.contains(node)) {
                    const prev = node.previousSibling
                    if (prev?.dataset?.raw != null) {
                        const atStartOrInTrailingSpace =
                            range.startOffset === 0 ||
                            node.textContent.trim() === ''
                        if (atStartOrInTrailingSpace) {
                            e.preventDefault()
                            const beforeChip = prev.previousSibling
                            if (beforeChip?.nodeType === 3) beforeChip.remove()
                            prev.remove()
                            const newRaw = this._getRawText().trim()
                            this._renderTokens(newRaw)
                            this._setCursor(newRaw.length)
                            this.props.onSearch(newRaw.trim())
                            return
                        }
                    }
                }
                // Case 2: cursor is in the editor div itself (not a text node),
                // e.g. when bar is initialized with a chip and not yet focused-typed
                if ((node === el || !el?.contains(node)) && el) {
                    const isAtEnd = range.startOffset >= el.childNodes.length ||
                        (node === el && range.startOffset === el.childNodes.length)
                    if (isAtEnd || node === el) {
                        if (this._deleteLastChip()) { e.preventDefault(); return }
                    }
                }
            }
        } else if (e.key === 'Enter') {
            e.preventDefault()
            this.props.onSearch(this._getRawText().trim())
        } else if (e.key === 'Tab') {
            const { tags = [] } = this.props
            const rawText = this._getRawText()
            const cursor = this._getCursor() ?? rawText.length
            const token = this._getCurrentToken(rawText, cursor).toLowerCase()
            const match = token ? tags.find(t => t.toLowerCase().includes(token)) : null
            if (match) {
                e.preventDefault()
                this.handleInsertTag(match)
            }
        } else if (e.key === 'Escape') {
            this.setState({ showPalette: false })
        }
    }

    handlePaste(e) {
        e.preventDefault()
        const text = e.clipboardData.getData('text/plain')
        document.execCommand('insertText', false, text)
    }

    handleFocus() {
        clearTimeout(this._blurTimeout)
    }

    handleBlur() {
        this._blurTimeout = setTimeout(() => this.setState({ showPalette: false, showOperators: false }), 150)
    }

    togglePalette() {
        this.setState(s => ({ showPalette: !s.showPalette, showOperators: false }))
    }

    handleClick() {
        // If cursor landed inside a contentEditable=false chip, move it after the chip
        const sel = window.getSelection()
        if (!sel?.rangeCount) return
        const range = sel.getRangeAt(0)
        const el = this.editorRef.current
        let node = range.startContainer
        while (node && node !== el) {
            if (node.nodeType === 1 && node.dataset?.raw != null) {
                const next = node.nextSibling
                const r = document.createRange()
                if (next && next.nodeType === 3) {
                    r.setStart(next, 0)
                } else {
                    r.setStartAfter(node)
                }
                r.collapse(true)
                sel.removeAllRanges()
                sel.addRange(r)
                return
            }
            node = node.parentNode
        }
    }

    handleInsertTag(tag) {
        const el = this.editorRef.current
        if (!el) return
        const rawText = this._getRawText()
        const cursor = this._getCursor() ?? rawText.length
        const token = this._getCurrentToken(rawText, cursor)

        // Replace the current partial token with the full tag
        const start = cursor - token.length
        const newRaw = rawText.slice(0, start) + tag + rawText.slice(cursor)

        this._renderTokens(newRaw)
        this._setCursor(start + tag.length)
        this.setState({ showPalette: false, showOperators: true })

        clearTimeout(this._debounce)
        this.props.onSearch(newRaw.trim())
    }

    render() {
        const { color, regex, loc, tags = [] } = this.props
        const { showPalette, showOperators } = this.state

        // Group tags by category prefix for the palette
        const tagGroups = {}
        tags.forEach(tag => {
            const cat = tag.split(':')[0]
            ;(tagGroups[cat] = tagGroups[cat] || []).push(tag)
        })

        return (
            <div className="search-input-wrapper">
                {color && <span className="search-color-dot" style={{ background: color }} />}
                <div
                    ref={this.editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={this.handleInput.bind(this)}
                    onKeyDown={this.handleKeyDown.bind(this)}
                    onPaste={this.handlePaste.bind(this)}
                    onFocus={this.handleFocus.bind(this)}
                    onBlur={this.handleBlur.bind(this)}
                    onClick={this.handleClick.bind(this)}
                    className={`search-tokens-editor form-control${color ? ' has-color-dot' : ''} has-tag-toggle`}
                    data-placeholder={regex ? loc.get('search_regex_placeholder') : loc.get('search_placeholder')}
                    spellCheck={false}
                />
                <button
                    className={`search-tag-toggle${showPalette ? ' active' : ''}`}
                    onMouseDown={e => { e.preventDefault(); this.togglePalette() }}
                    title={loc.get('search_tags_toggle') || 'Etiquetas'}
                    aria-label={loc.get('search_tags_toggle') || 'Etiquetas'}
                    tabIndex={-1}
                >
                    <Tags size={13} />
                </button>
                {showOperators && (
                    <div className="search-operator-palette">
                        <button
                            className="search-operator-btn"
                            onMouseDown={e => { e.preventDefault(); this.handleInsertOperator(' & ') }}
                            title="Y (AND)"
                        >&amp; Y</button>
                        <button
                            className="search-operator-btn"
                            onMouseDown={e => { e.preventDefault(); this.handleInsertOperator(' | ') }}
                            title="O (OR)"
                        >| O</button>
                    </div>
                )}
                {!showOperators && showPalette && tags.length > 0 && (
                    <div className="search-tag-palette">
                        {Object.entries(tagGroups).map(([cat, catTags]) => (
                            <div key={cat} className="search-tag-palette-group">
                                <div className="search-tag-palette-group-label">
                                    {loc.get(`tag_category_${cat}`) || cat}
                                </div>
                                <div className="search-tag-palette-group-items">
                                    {catTags.map(tag => (
                                        <button
                                            key={tag}
                                            className={`search-tag-palette-item ${tagCategoryClass(tag)}`}
                                            onMouseDown={e => { e.preventDefault(); this.handleInsertTag(tag) }}
                                        >
                                            {loc.get(`tag_${tag}`) || tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )
    }
}
