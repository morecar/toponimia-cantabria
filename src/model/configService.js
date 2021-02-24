export default class ConfigService {
    constructor() {
        this.localConfig = localStorage.getItem("config")
        if(!this.localConfig) {
            this.localConfig = this.getDefaultConfig()
            this.saveToLocalStorage()
        } else {
            this.localConfig = JSON.parse(this.localConfig)
        }
    }

    getDefaultConfig() {
        return {
            lang: 'ast',
            results_title: 'never',
            results_tags: 'search',
            results_types: ['point'],
            search_autocomplete_underdoth: true,
            search_autocomplete_tags: false,
            search_display_tag_palette: false
          }
    }

    saveToLocalStorage() {
        localStorage.setItem("config", JSON.stringify(this.localConfig))
    }

    get language() {
        return this.localConfig.lang
    }

    set language(newLanguage) {
        this.localConfig.lang = newLanguage;
        this.saveToLocalStorage()
    }

    get resultsTitle() {
        return this.localConfig.results_title
    }

    set resultsTitle(newResultsTitle) {
        this.localConfig.results_title = newResultsTitle;
        this.saveToLocalStorage()
    }

    get resultsTags() {
        return this.localConfig.results_tags
    }

    set resultsTags(newResultsTags) {
        this.localConfig.results_tags = newResultsTags;
        this.saveToLocalStorage()
    }

    get resultsTypes() {
        return this.localConfig.results_types
    }

    set resultsTypes(newResultsTypes) {
        this.localConfig.results_types = newResultsTypes;
        this.saveToLocalStorage()
    }

    get searchAutocompleteUnderdoth() {
        return this.localConfig.search_autocomplete_underdoth
    }

    set searchAutocompleteUnderdoth(newSearchAutocompleteUnderdoth) {
        this.localConfig.search_autocomplete_underdoth = newSearchAutocompleteUnderdoth;
        this.saveToLocalStorage()
    }

    get searchAutocompleteTags() {
        return this.localConfig.search_autocomplete_tags
    }

    set searchAutocompleteTags(newSearchAutocompleteTags) {
        this.localConfig.search_autocomplete_tags = newSearchAutocompleteTags;
        this.saveToLocalStorage()
    }

    get searchDisplayTagPalette() {
        return this.localConfig.search_display_tag_palette
    }

    set searchDisplayTagPalette(newSearchDisplayTagPalette) {
        this.localConfig.search_display_tag_palette = newSearchDisplayTagPalette;
        this.saveToLocalStorage()
    }
}