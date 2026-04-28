export const EMPTY_FORM = () => ({
  draftId: null,
  hash: null,
  name: '',
  vernacular: '',
  type: 'point',
  coordinates: [],
  tags: [],
  attestations: [],
  etymology_ids: [],
  notes: '',
})

export const EMPTY_ATTESTATION = () => ({ year: '', source: '', url: '', occurrences: [{ highlight: '', quote: '' }] })

// Convert flat {highlight, quote} schema to nested {occurrences} schema.
// Safe to call on attestations that are already in nested form.
export function normalizeAttestation(att) {
  if (att.occurrences) return att
  const { highlight = '', quote = '', ...rest } = att
  return { ...rest, occurrences: [{ highlight, quote }] }
}
export const EMPTY_NEW_ETYM    = () => ({ origin: '', meaning: '', notes: '' })
export const EMPTY_ETYM_FORM   = () => ({ id: null, origin: '', meaning: '', notes: '', tags: '' })

export const SOURCE_TEMPLATES = [
  { label: 'Catastro Ensenada',    year: '1749', source: 'Catastro de Ensenada',                 url: 'https://pares.cultura.gob.es/catastro/servlets/ServletController' },
  { label: 'Becerro Behetrías',    year: '1352', source: 'Becerro de las Behetrías de Castilla', url: '' },
  { label: 'Libro de la Montería', year: '1348', source: 'Libro de la Montería, Alfonso XI',     url: '' },
]

export const NGBE_URL = 'https://services-eu1.arcgis.com/nA3ZoO5T3PsqLUnE/arcgis/rest/services/Toponimia_de_Cantabria_Registro_Principal/FeatureServer/0/query'

export const NGBE_GROUP_LABELS = {
  '1': 'División administrativa',
  '2': 'Población y edificios',
  '3': 'Transporte',
  '4': 'Orografía y relieve',
  '5': 'Hidrografía continental',
  '6': 'Costa y mar',
}

export const NGBE_CAT_LABELS = {
  '1.1': 'Comunidad autónoma',
  '1.2': 'Región',
  '1.3': 'Municipios',
  '1.4': 'Entidades de población',
  '1.5': 'Entidades singulares',
  '1.6': 'Núcleos',
  '1.7': 'Mancomunidades',
  '1.8': 'Entidades menores',
  '1.9': 'Zonas administrativas',
  '2.1': 'Núcleos de población',
  '2.2': 'Edificios y equipamientos',
  '2.3': 'Hitos y mojones',
  '3.1': 'Aeropuertos y aeródromos',
  '3.2': 'Puertos y dársenas',
  '3.3': 'Estaciones ferroviarias',
  '4.1': 'Orografía',
  '4.2': 'Tierras y parajes',
  '4.3': 'Cotos',
  '5.1': 'Ríos y arroyos',
  '5.2': 'Marismas y lagunas',
  '5.3': 'Canales y acequias',
  '5.4': 'Embalses y azudes',
  '5.5': 'Fuentes y manantiales',
  '6.1': 'Estuarios y bahías',
  '6.2': 'Costas y playas',
  '6.3': 'Bajos y bajíos',
}

export function tagColor(tag) {
  if (tag.startsWith('etymology:')) return '#2563eb'
  if (tag.startsWith('feature:'))   return '#d97706'
  return '#6c757d'
}

// Strip markdown-style paired asterisks (*word* → word).
// Preserves leading-only asterisk (*word, no trailing) which is linguistic reconstruction notation.
export const stripFmt    = s => s?.replace(/^\*+(.+?)\*+$/, '$1') ?? s
export const stripFmtInline = s => s?.replace(/\*+([^*]+)\*+/g, '$1') ?? s
