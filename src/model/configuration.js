import {CONFIG_LOCALSTORAGE_KEY, CONFIG_DEFAULT} from '../resources/constants'

export default class ConfigService {
    constructor(config) {
        Object.entries(CONFIG_DEFAULT).forEach(([key, defaultValue]) => (config[key] = config[key]??defaultValue))

        this.config = config
    }

    static readFromLocalStorage() {
        return new ConfigService(JSON.parse(localStorage.getItem(CONFIG_LOCALSTORAGE_KEY) ?? "{}"))
    }

    _scheduleWrite() {
        clearTimeout(this._writeTimer)
        this._writeTimer = setTimeout(() => {
            localStorage.setItem(CONFIG_LOCALSTORAGE_KEY, JSON.stringify(this._config))
        }, 0)
    }

    // Synchronous write used during construction so the initial state is persisted immediately.
    writeToLocalStorage() {
        clearTimeout(this._writeTimer)
        localStorage.setItem(CONFIG_LOCALSTORAGE_KEY, JSON.stringify(this._config))
    }

    set config(newConfig) {
        this._config = newConfig
        this.writeToLocalStorage()
    }

    get locale() { return this._config.locale }
    set locale(v) { this._config.locale = v; this._scheduleWrite() }

    get resultsTitle() { return this._config.results_title }
    set resultsTitle(v) { this._config.results_title = v; this._scheduleWrite() }

    get resultsTags() { return this._config.results_tags }
    set resultsTags(v) { this._config.results_tags = v; this._scheduleWrite() }

    get resultsTypes() { return this._config.results_types }
    set resultsTypes(v) { this._config.results_types = v; this._scheduleWrite() }

    get searchAutocompleteUnderdoth() { return this._config.search_autocomplete_underdoth }
    set searchAutocompleteUnderdoth(v) { this._config.search_autocomplete_underdoth = v; this._scheduleWrite() }

    get searchAutocompleteTags() { return this._config.search_autocomplete_tags }
    set searchAutocompleteTags(v) { this._config.search_autocomplete_tags = v; this._scheduleWrite() }

    get searchDisplayTagPalette() { return this._config.search_display_tag_palette }
    set searchDisplayTagPalette(v) { this._config.search_display_tag_palette = v; this._scheduleWrite() }

    get searchUseRegex() { return this._config.search_use_regex }
    set searchUseRegex(v) { this._config.search_use_regex = v; this._scheduleWrite() }

    get markerSize() { return this._config.marker_size }
    set markerSize(v) { this._config.marker_size = v; this._scheduleWrite() }
}
