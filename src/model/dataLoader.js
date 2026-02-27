const DATA_URL = process.env.REACT_APP_DATA_URL || `${process.env.PUBLIC_URL}/data.json`
const HASH_URL = DATA_URL.replace(/data\.json$/, 'data-hash.json')

export default class DataLoader {
  static async load() {
    try {
      const hashRes = await fetch(HASH_URL)
      if (hashRes.ok) {
        const { hash } = await hashRes.json()
        if (hash === localStorage.getItem('localIndexHash')) return null  // cache valid

        // Hash differs — fetch full data
        const dataRes = await fetch(DATA_URL)
        if (!dataRes.ok) throw new Error(`Failed to fetch data: ${dataRes.status}`)
        const json = await dataRes.json()
        return { hash, rows: json.data }
      }
    } catch {} // fall through to unconditional load on any error

    // Fallback (hash fetch failed): load data.json directly
    const response = await fetch(DATA_URL)
    if (!response.ok) throw new Error(`Failed to fetch data: ${response.status}`)
    const json = await response.json()
    return { hash: json.hash, rows: json.data }
  }
}
