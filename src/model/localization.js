import * as Locales from '../resources/localization/all'

export default class Localization {
    constructor(locale) {
        this.locale = locale
    }

    get locale() {
        return this._locale
    }

    get availableLocales() {
        return Object.keys(Locales).filter(l => l !== 'unlocalizable')
    }

    set locale(newLocale) {
        if(!Object.keys(Locales).includes(newLocale)) throw new Error("Unknown Locale")
        
        this._locale = newLocale
        this.repository = {...Locales.unlocalizable, ...Locales[newLocale]}
    }

    get(code) {
        return this.repository[code] ?? code
    }

    getBatch(codes) {
        
        return codes.map(code => 
                            ({
                                key: code, 
                                value: this.get(code)
                            }))
    }

    static createFromConfig(config) {
        const available = Object.keys(Locales).filter(l => l !== 'unlocalizable')
        const locale = available.includes(config.locale) ? config.locale : available[0]
        return new Localization(locale)
    }
}