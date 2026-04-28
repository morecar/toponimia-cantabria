/**
 * @typedef {Object} Occurrence
 * @property {string} highlight - The attested form as it appears in the source
 * @property {string} quote     - Surrounding context from the source text
 */

/**
 * @typedef {Object} Attestation
 * @property {string}       year
 * @property {string}       source
 * @property {string}       [url]
 * @property {string}       [projectId] - ID of the TextProject this came from
 * @property {Occurrence[]} occurrences
 */

/**
 * @typedef {Object} Toponym
 * @property {string}        hash
 * @property {string}        title
 * @property {'point'|'line'|'poly'} type
 * @property {number[][]}    coordinates - [[lat, lng], ...]
 * @property {string[]}      tags
 * @property {string[]}      etymology_ids
 * @property {Attestation[]} attestations
 * @property {string}        notes
 * @property {string}        [vernacular]
 */

/**
 * @typedef {Object} DraftToponym
 * @property {string}        draftId
 * @property {string|null}   hash       - null for new toponyms not yet in the index
 * @property {string}        name
 * @property {string}        [vernacular]
 * @property {'point'|'line'|'poly'} type
 * @property {number[][]}    coordinates
 * @property {string[]}      tags
 * @property {Attestation[]} attestations
 * @property {string[]}      etymology_ids
 * @property {string}        notes
 * @property {boolean}       [deleted]
 */

/**
 * @typedef {Object} Etymology
 * @property {string} id
 * @property {string} [origin]
 * @property {string} [meaning]
 * @property {string} [notes]
 * @property {string} [tags]   - comma-separated
 * @property {boolean} [deleted]
 */

/**
 * @typedef {Object} TextProject
 * @property {string} id
 * @property {string} title
 * @property {string} [year]
 * @property {string} [url]
 * @property {string} text
 * @property {string} createdAt
 */
