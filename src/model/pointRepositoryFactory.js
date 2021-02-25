import PointRepository from './pointRepository'

export async function  buildRepositoryFrom(googleSheet) {
    return shouldReload(googleSheet) 
        ? reloadLocalDatabase(googleSheet).then(localDatabase => new PointRepository(JSON.parse(localDatabase)))
        : Promise.resolve(new PointRepository(JSON.parse(localStorage.getItem("localIndex"))))
}

async function reloadLocalDatabase(googleSheet) {
    const remoteElementCount = googleSheet.rowCount
    googleSheet.getRows().then(rows => {
        const remoteDatabase = rows.map(row => ({ title: row.name, type: row.type, coordinates: row.coordinates.trim().split(';').map(pair => pair.trim().split(',').map(parseFloat)), tags: row.tags.split(',')}))
        localStorage.setItem("localIndex", JSON.stringify(remoteDatabase) )
        localStorage.setItem("localIndexSize", remoteElementCount)
    })
    return localStorage.getItem("localIndex")
}

function shouldReload(googleSheet) {
    const localStorageElementCount = parseInt(localStorage.getItem("localIndexSize"))
    const remoteDbElementCount = parseInt(googleSheet.rowCount)

    const reload = localStorageElementCount !== remoteDbElementCount

    console.log(`Database: reload=${reload}`)
    return reload
}