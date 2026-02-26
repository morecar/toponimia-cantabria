const DATA_URL = process.env.REACT_APP_DATA_URL || `${process.env.PUBLIC_URL}/data.json`

export default class DataLoader {
  static async load() {
    const response = await fetch(DATA_URL)
    if (!response.ok) throw new Error(`Failed to fetch data: ${response.status}`)
    const json = await response.json()
    return { hash: json.hash, rows: json.data }
  }
}
