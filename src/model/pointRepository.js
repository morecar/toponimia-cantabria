import _ from 'lodash'

export default class PointRepository {

    constructor(database) {
        this.database = _(database).orderBy(['title'])
    }

    search(pattern, sanitizeInput=true) {
        var searchPattern = sanitizeInput ? this.preprocessPattern(pattern) : pattern
        let regex = RegExp(searchPattern, 'i')

        return this.database.filter(entry => regex.test(entry.title)).value()
    }

    getAllTags() {
        let tags = new Set()
        this.database.map(entry => entry.tags).forEach(tag => tags.add(tag))
        return Array.from(tags)
    }

    preprocessPattern(pattern){
        var temp = pattern.replace("a", "([áa])")
                            .replace("e", "([ée])")
                            .replace("i", "([íi])")
                            .replace("o", "([óo])")
                            .replace("u", "([úu])")
        return temp;
    }
}