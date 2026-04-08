// ── Google Drive App-Data sync ─────────────────────────────────────────────────
// Syncs the three localStorage keys to a hidden file in the user's Google Drive
// (appDataFolder — not visible to the user in Drive UI).
// Auth uses Google Identity Services (GIS) loaded lazily from Google's CDN.
// ALL network operations fail silently — Drive sync must never break the app.

const SYNC_KEYS  = ['draftToponyms', 'draftEtymologies', 'textProjects_v1']
const FILE_NAME  = 'toponimia-backoffice-state.json'
const SCOPE      = 'https://www.googleapis.com/auth/drive.appdata'
const TOKEN_KEY  = 'gd_access_token'
const EXPIRY_KEY = 'gd_token_expiry'
const FILE_ID_KEY = 'gd_file_id'

function clientId() {
  return process.env.REACT_APP_GOOGLE_OAUTH_CLIENT_ID
}

// ── Token storage ─────────────────────────────────────────────────────────────
function getToken() {
  const token  = localStorage.getItem(TOKEN_KEY)
  const expiry = parseInt(localStorage.getItem(EXPIRY_KEY) || '0')
  if (!token || Date.now() > expiry) return null
  return token
}
function setToken(token, expiresIn) {
  localStorage.setItem(TOKEN_KEY,  token)
  localStorage.setItem(EXPIRY_KEY, String(Date.now() + expiresIn * 1000 - 60_000))
}
function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(EXPIRY_KEY)
}

export function isAuthenticated() { return !!getToken() }

// ── GIS library (loaded lazily) ───────────────────────────────────────────────
let gisLoaded = false
function loadGIS() {
  if (gisLoaded || window.google?.accounts?.oauth2) { gisLoaded = true; return Promise.resolve() }
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.onload  = () => { gisLoaded = true; resolve() }
    s.onerror = reject
    document.head.appendChild(s)
  })
}

// ── Token client ──────────────────────────────────────────────────────────────
let tokenClient = null
function getTokenClient(callback) {
  if (!clientId() || !window.google?.accounts?.oauth2) return null
  if (!tokenClient) {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId(),
      scope: SCOPE,
      callback,
    })
  } else {
    tokenClient.callback = callback
  }
  return tokenClient
}

// Request auth with user interaction (shows consent popup if needed)
export async function requestAuth() {
  await loadGIS()
  return new Promise((resolve) => {
    const client = getTokenClient((resp) => {
      if (resp.error) { resolve(false); return }
      setToken(resp.access_token, parseInt(resp.expires_in))
      resolve(true)
    })
    if (!client) { resolve(false); return }
    client.requestAccessToken({ prompt: 'consent' })
  })
}

// Try silent auth — works if user has already consented & Google session is active
export async function trySilentAuth() {
  if (getToken()) return true
  if (!clientId()) return false
  try {
    await loadGIS()
    return await new Promise((resolve) => {
      const client = getTokenClient((resp) => {
        if (resp.error) { resolve(false); return }
        setToken(resp.access_token, parseInt(resp.expires_in))
        resolve(true)
      })
      if (!client) { resolve(false); return }
      client.requestAccessToken({ prompt: '' })
      // GIS with prompt:'' resolves synchronously or quickly; fallback timeout
      setTimeout(() => resolve(false), 3000)
    })
  } catch { return false }
}

export function disconnect() {
  clearToken()
  localStorage.removeItem(FILE_ID_KEY)
}

// ── Drive REST helpers ────────────────────────────────────────────────────────
async function driveRequest(url, options = {}) {
  const token = getToken()
  if (!token) return null
  const res = await fetch(url, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  })
  if (res.status === 401) { clearToken(); return null }
  return res.ok ? res : null
}

async function findFileId() {
  const cached = localStorage.getItem(FILE_ID_KEY)
  if (cached) return cached
  const res = await driveRequest(
    `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name%3D'${encodeURIComponent(FILE_NAME)}'&fields=files(id)`
  )
  if (!res) return null
  const { files } = await res.json()
  const id = files?.[0]?.id ?? null
  if (id) localStorage.setItem(FILE_ID_KEY, id)
  return id
}

// ── Sync to Drive ─────────────────────────────────────────────────────────────
export async function syncToDrive() {
  try {
    if (!getToken()) return
    const state = {}
    for (const key of SYNC_KEYS) {
      const raw = localStorage.getItem(key)
      if (raw) state[key] = JSON.parse(raw)
    }
    const body     = JSON.stringify({ ...state, _syncedAt: new Date().toISOString() })
    const fileId   = await findFileId()
    const form     = new FormData()
    const metadata = fileId ? {} : { name: FILE_NAME, parents: ['appDataFolder'] }
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
    form.append('file',     new Blob([body],                     { type: 'application/json' }))

    const url    = fileId
      ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
      : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart'
    const method = fileId ? 'PATCH' : 'POST'
    const token  = getToken()
    const res    = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` }, body: form })
    if (res.ok && !fileId) {
      const data = await res.json()
      localStorage.setItem(FILE_ID_KEY, data.id)
    }
  } catch (e) {
    console.debug('[driveSync] upload failed:', e)
  }
}

// ── Sync from Drive ───────────────────────────────────────────────────────────
// Returns true if data was loaded, false otherwise.
export async function syncFromDrive() {
  try {
    const fileId = await findFileId()
    if (!fileId) return false
    const res = await driveRequest(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`
    )
    if (!res) return false
    const state = await res.json()
    for (const key of SYNC_KEYS) {
      if (state[key] !== undefined) localStorage.setItem(key, JSON.stringify(state[key]))
    }
    return true
  } catch (e) {
    console.debug('[driveSync] download failed:', e)
    return false
  }
}

// ── Debounced upload trigger (called after every local save) ──────────────────
let syncTimer = null
export function scheduleDriveSync() {
  clearTimeout(syncTimer)
  syncTimer = setTimeout(syncToDrive, 1500)
}
