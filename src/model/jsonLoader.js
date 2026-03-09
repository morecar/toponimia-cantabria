export default class JsonLoader {
  constructor({ dataUrl, hashUrl, cacheKey }) {
    this.dataUrl = dataUrl
    this.hashUrl = hashUrl
    this.cacheKey = cacheKey
  }

  async load() {
    try {
      const hashRes = await fetch(this.hashUrl)
      if (hashRes.ok) {
        const { hash } = await hashRes.json()
        const cachedHash = localStorage.getItem(`${this.cacheKey}Hash`)
        if (hash === cachedHash) {
          const cached = localStorage.getItem(this.cacheKey)
          if (cached) return JSON.parse(cached)
        }
        const dataRes = await fetch(this.dataUrl)
        if (!dataRes.ok) throw new Error(`Failed to fetch ${this.dataUrl}: ${dataRes.status}`)
        const json = await dataRes.json()
        localStorage.setItem(this.cacheKey, JSON.stringify(json.data))
        localStorage.setItem(`${this.cacheKey}Hash`, hash)
        return json.data
      }
    } catch {} // fall through

    const response = await fetch(this.dataUrl)
    if (!response.ok) throw new Error(`Failed to fetch ${this.dataUrl}: ${response.status}`)
    const json = await response.json()
    return json.data || []
  }
}
