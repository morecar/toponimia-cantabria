export default class AttestationsStore {
  constructor(rows) {
    this.byHash = new Map()
    ;(rows || []).forEach(r => {
      if (!this.byHash.has(r.topo_hash)) this.byHash.set(r.topo_hash, [])
      this.byHash.get(r.topo_hash).push(r)
    })
    this.byHash.forEach((list, key) => {
      this.byHash.set(key, list.slice().sort((a, b) => a.year - b.year))
    })
  }

  getByHash(hash) {
    return this.byHash.get(hash) || []
  }
}
