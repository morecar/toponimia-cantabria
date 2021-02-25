import PointRepository from './pointRepository'


export async function buildRepositoryFromSheet(spreadsheet) {
    if (shouldReload(spreadsheet.hash)) reloadLocalDatabase(spreadsheet.hash, spreadsheet.sheet)
  
    return buildRepositoryFromLocal()
}


async function buildRepositoryFromLocal() {
    return Promise.resolve(new PointRepository(JSON.parse(localStorage.getItem("localIndex"))))
}

async function reloadLocalDatabase(newHash, googleSheet) {
    googleSheet.getRows().then(rows => {
        const remoteDatabase = rows.map(row => ({ title: row.name, type: row.type, coordinates: row.coordinates.trim().split(';').map(pair => pair.trim().split(',').map(parseFloat)), tags: row.tags.split(',')}))
        localStorage.setItem("localIndex", JSON.stringify(remoteDatabase) )
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