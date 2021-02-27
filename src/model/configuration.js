
const CONFIG_LOCALSTORAGE_KEY = "config"

const DEFAULT_CONFIG = {
    lang: 'ast',
    results_title: 'never',
    results_tags: 'search',
    results_types: ['point'],
    search_autocomplete_underdoth: true,
    search_autocomplete_tags: false,
    search_display_tag_palette: false
  }

export default class ConfigService {
    constructor(config) {
        Object.entries(DEFAULT_CONFIG).forEach(([key, defaultValue]) => (config[key] = config[key]??defaultValue))

        this.config = config
    }

    static readFromLocalStorage() {
        return new ConfigService(JSON.parse(localStorage.getItem(CONFIG_LOCALSTORAGE_KEY) ?? "{}"))
    }

    writeToLocalStorage() {
        localStorage.setItem(CONFIG_LOCALSTORAGE_KEY, JSON.stringify(this._config))
    }

    set config(newConfig) {
        this._config = newConfig
        this.writeToLocalStorage()
    }

    get language() {
        return this._config.lang
    }

    set language(newLanguage) {
        this._config.lang = newLanguage;
        this.writeToLocalStorage()
    }

    get resultsTitle() {
        return this._config.results_title
    }

    set resultsTitle(newResultsTitle) {
        this._config.results_title = newResultsTitle;
        this.writeToLocalStorage()
    }

    get resultsTags() {
        return this._config.results_tags
    }

    set resultsTags(newResultsTags) {
        this._config.results_tags = newResultsTags;
        this.writeToLocalStorage()
    }

    get resultsTypes() {
        return this._config.results_types
    }

    set resultsTypes(newResultsTypes) {
        this._config.results_types = newResultsTypes;
        this.writeToLocalStorage()
    }

    get searchAutocompleteUnderdoth() {
        return this._config.search_autocomplete_underdoth
    }

    set searchAutocompleteUnderdoth(newSearchAutocompleteUnderdoth) {
        this._config.search_autocomplete_underdoth = newSearchAutocompleteUnderdoth;
        this.writeToLocalStorage()
    }

    get searchAutocompleteTags() {
        return this._config.search_autocomplete_tags
    }

    set searchAutocompleteTags(newSearchAutocompleteTags) {
        this._config.search_autocomplete_tags = newSearchAutocompleteTags;
        this.writeToLocalStorage()
    }

    get searchDisplayTagPalette() {
        return this._config.search_display_tag_palette
    }

    set searchDisplayTagPalette(newSearchDisplayTagPalette) {
        this._config.search_display_tag_palette = newSearchDisplayTagPalette;
        this.writeToLocalStorage()
    }
}