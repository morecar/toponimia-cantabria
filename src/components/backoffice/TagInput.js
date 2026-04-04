import { useState, useRef, useEffect } from 'react'
import { tagColor } from './constants'

export default function TagInput({ tags, knownTags, loc, onChange }) {
  const [query, setQuery]               = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered  = knownTags.filter(t => !tags.includes(t) && t.toLowerCase().includes(query.toLowerCase()))
  const trimmed   = query.trim()
  const canCreate = trimmed && !knownTags.includes(trimmed) && !tags.includes(trimmed)

  const addTag = (tag) => { onChange([...tags, tag]); setQuery(''); setShowDropdown(false) }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered.length > 0) addTag(filtered[0])
      else if (canCreate)       addTag(trimmed)
    }
    if (e.key === 'Escape') setShowDropdown(false)
  }

  return (
    <div className="bo-tag-input-wrap" ref={wrapRef}>
      <div className="bo-tag-chips">
        {tags.map(tag => (
          <span key={tag} className="bo-tag-chip" style={{ background: tagColor(tag) }}>
            {loc.get(`tag_${tag}`) || tag.split(':').pop().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            <button className="bo-tag-chip-remove" onClick={() => onChange(tags.filter(t => t !== tag))}>×</button>
          </span>
        ))}
        <input
          className="bo-tag-search"
          value={query}
          onChange={e => { setQuery(e.target.value); setShowDropdown(true) }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length ? '' : 'Buscar o crear etiqueta…'}
        />
      </div>
      {showDropdown && (filtered.length > 0 || canCreate) && (
        <div className="bo-dropdown">
          {filtered.map(tag => (
            <button key={tag} className="bo-dropdown-item" onClick={() => addTag(tag)}>
              <span className="bo-dropdown-dot" style={{ background: tagColor(tag) }} />
              {loc.get(`tag_${tag}`) || tag.split(':').pop().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
          {canCreate && (
            <button className="bo-dropdown-item bo-dropdown-create" onClick={() => addTag(trimmed)}>
              + Crear: <em>"{trimmed}"</em>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
