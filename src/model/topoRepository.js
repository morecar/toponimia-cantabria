import _ from 'lodash'
import { parseExpression, evaluateExpression, shouldShowPreview } from './queryParser'

export async function buildRepositoryFromSheet(spreadsheet) {
    if (shouldReload(spreadsheet.hash))
        await reloadLocalDatabase(spreadsheet.hash, spreadsheet.rows)

    return buildRepositoryFromLocalStorage()
}

export function buildRepositoryFromLocalStorage () {
    return new TopoRepository(JSON.parse(localStorage.getItem("localIndex")))
}

async function reloadLocalDatabase(newHash, rows) {
    const remotedb = (Array.isArray(rows) ? rows : Object.values(rows)).map(row => ({
        hash: row.hash,
        title: row.name,
        type: row.type,
        coordinates: row.coordinates.trim().split(';').map(pair => pair.trim().split(',').map(parseFloat)),
        tags: row.tags ? row.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        etymology_ids: row.etymology_ids ? String(row.etymology_ids).split(',').map(s => s.trim()) : [],
        attestations: row.attestations || [],
        notes: row.notes || '',
    }))
    localStorage.setItem("localIndex", JSON.stringify(remotedb))
    localStorage.setItem("localIndexHash", newHash)
    console.log(`Database: updated to ${newHash}`)
}

function shouldReload(newHash) {
    const currentHash = localStorage.getItem("localIndexHash")

    const reload = newHash !== currentHash

    console.log(`Database: current is ${currentHash}, reload=${reload}`)
    return reload
}

class TopoRepository {

    constructor(database) {
        this.database = _(database).orderBy(['title'])
        this.etymologyStore = null
    }

    _withEtymologyTags(entry) {
        if (!this.etymologyStore) return entry
        const etymTags = (entry.etymology_ids || []).flatMap(id => {
            const etym = this.etymologyStore.getById(id)
            return etym?.tags ? etym.tags.split(',').map(t => t.trim()).filter(Boolean) : []
        })
        if (etymTags.length === 0) return entry
        return { ...entry, tags: [...(entry.tags || []), ...etymTags] }
    }

    getFromQueryString(queryString, regex = true) {
        if (!queryString.trim()) return this.database.value()

        if (regex) {
            const knownTags = this.getAllTags()
            const groups = parseExpression(queryString, knownTags)
            if (groups && shouldShowPreview(groups)) {
                return this.database.filter(entry => evaluateExpression(this._withEtymologyTags(entry), groups, true)).value()
            }
            try {
                const re = RegExp(`^${queryString}$`, 'i')
                return this.database.filter(entry => re.test(entry.title)).value()
            } catch {
                return this.database.filter(entry => entry.title.toLowerCase().includes(queryString.toLowerCase())).value()
            }
        } else {
            return this.database.filter(entry => entry.title.toLowerCase().includes(queryString.toLowerCase())).value()
        }
    }

    getFromId(wordId) {
        const result = this.database.filter(entry => entry.hash === wordId).value()
        return result?.[0] ?? undefined
    }

    getAllEntries() {
        return this.database.value()
    }

    getAllTags() {
        const tags = new Set()
        this.database.forEach(entry => {
            (entry.tags || []).forEach(tag => { if (tag) tags.add(tag) })
            const withEtym = this._withEtymologyTags(entry)
            ;(withEtym.tags || []).forEach(tag => { if (tag) tags.add(tag) })
        })
        return Array.from(tags)
    }
}
