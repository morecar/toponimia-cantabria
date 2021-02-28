import _ from 'lodash'

export async function buildRepositoryFromSheet(spreadsheet) {
    if (shouldReload(spreadsheet.hash)) 
        await reloadLocalDatabase(spreadsheet.hash, spreadsheet.sheet)

    return buildRepositoryFromLocalStorage()
}

export function buildRepositoryFromLocalStorage () {
    return new TopoRepository(JSON.parse(localStorage.getItem("localIndex")))
}

async function reloadLocalDatabase(newHash, googleSheet) {
    return googleSheet.getRows().then(rows => {
        const remotedb = rows.map(row => ({ hash: row.hash, title: row.name, type: row.type, coordinates: row.coordinates.trim().split(';').map(pair => pair.trim().split(',').map(parseFloat)), tags: row.tags.split(',')}))
        localStorage.setItem("localIndex", JSON.stringify(remotedb))
        localStorage.setItem("localIndexHash", newHash)

        console.log(`Database: updated to ${newHash}`)
    })
}

function shouldReload(newHash) {
    const currentHash = localStorage.getItem("localIndexHash")

    const reload = newHash !== currentHash

    console.log(`Database: current is ${currentHash}, reload=${reload}`)
    return reload
}

export default class TopoRepository {

    constructor(database) {
        this.database = _(database).orderBy(['title'])
    }

    search(pattern, useRegex = true, matchMissingAccents = true) {
        var searchPattern = useRegex ? pattern : pattern.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') 
        searchPattern = matchMissingAccents ? this.accountForMissingAccents(searchPattern) : searchPattern

        let regex = RegExp(searchPattern, 'i')

        return this.database.filter(entry => regex.test(entry.title)).value()
    }
    
    getAllTags() {
        let tags = new Set()
        this.database.map(entry => entry.tags).forEach(tag => tags.add(tag))
        return Array.from(tags)
    }

    accountForMissingAccents(pattern){
        var temp = pattern.replace("a", "([áa])")
                          .replace("e", "([ée])")
                          .replace("i", "([íi])")
                          .replace("o", "([óo])")
                          .replace("u", "([úu])")
        return temp;
    }
}
