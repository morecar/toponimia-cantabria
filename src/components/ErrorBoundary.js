import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    const { fallback } = this.props
    if (fallback) return fallback(error, () => this.setState({ error: null }))

    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
        <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Algo ha fallado.</p>
        <p style={{ fontSize: '0.875rem', marginBottom: '1rem', fontFamily: 'monospace' }}>{error.message}</p>
        <button
          style={{ padding: '0.4rem 1rem', cursor: 'pointer' }}
          onClick={() => this.setState({ error: null })}
        >
          Reintentar
        </button>
      </div>
    )
  }
}
