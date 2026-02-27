const DATA_URL = process.env.REACT_APP_DATA_URL || `${process.env.PUBLIC_URL}/data.json`
const HASH_URL = `${process.env.PUBLIC_URL}/data-hash.json`
const USE_CUSTOM_URL = !!process.env.REACT_APP_DATA_URL

export default class DataLoader {
  static async load() {
    if (!USE_CUSTOM_URL) {
      // Fetch only the hash first — fast check before downloading all data
      try {
        const hashResponse = await fetch(HASH_URL)
        if (hashResponse.ok) {
          const { hash } = await hashResponse.json()
          if (hash === localStorage.getItem('localIndexHash')) {
            return null  // Cache is valid, skip full download
          }
        }
      } catch {} // Fall through to full load on any error
    }

    const response = await fetch(DATA_URL)
    if (!response.ok) throw new Error(`Failed to fetch data: ${response.status}`)
    const json = await response.json()
    return { hash: json.hash, rows: json.data }
  }
}
