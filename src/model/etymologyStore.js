export default class EtymologyStore {
  constructor(rows) {
    this.byId = new Map()
    ;(rows || []).forEach(r => this.byId.set(r.id, r))
  }

  getById(id) {
    return this.byId.get(id) || null
  }

  getAll() {
    return Array.from(this.byId.values())
  }
}
