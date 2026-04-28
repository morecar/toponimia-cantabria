const DATA_URL = process.env.REACT_APP_TOPONYMS_URL || `${process.env.PUBLIC_URL}/toponyms.json`
const HASH_URL = process.env.REACT_APP_TOPONYMS_HASH_URL || `${process.env.PUBLIC_URL}/toponyms-hash.json`

export default class DataLoader {
  static async load() {
    let cachedHash = null
    try {
      const hashRes = await fetch(HASH_URL)
      if (hashRes.ok) {
        const { hash } = await hashRes.json()
        cachedHash = hash
        if (hash === localStorage.getItem('localIndexHash')) return null  // cache valid

        const dataRes = await fetch(DATA_URL)
        if (!dataRes.ok) throw new Error(`Failed to fetch data: ${dataRes.status}`)
        const json = await dataRes.json()
        return { hash, rows: json.data }
      }
    } catch (e) {
      console.warn('[DataLoader] Hash check failed, falling back to direct load:', e)
    }

    const response = await fetch(DATA_URL)
    if (!response.ok) throw new Error(`Failed to fetch data: ${response.status}`)
    const json = await response.json()
    return { hash: cachedHash ?? json.hash, rows: json.data }
  }
}
