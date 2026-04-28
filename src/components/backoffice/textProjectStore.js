import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { scheduleDriveSync } from '../../model/driveSync'

const KEY = 'textProjects_v1'

const legacyStorage = {
  getItem: () => ({
    state: { projects: JSON.parse(localStorage.getItem(KEY) ?? '[]') },
  }),
  setItem: (_, { state }) => {
    localStorage.setItem(KEY, JSON.stringify(state.projects))
  },
  removeItem: () => localStorage.removeItem(KEY),
}

export const useTextProjectStore = create(
  persist(
    (set, get) => ({
      projects: [],

      saveTextProject: (project) => {
        set(s => {
          const idx = s.projects.findIndex(p => p.id === project.id)
          return {
            projects: idx >= 0
              ? s.projects.map((p, i) => i === idx ? project : p)
              : [...s.projects, project],
          }
        })
        scheduleDriveSync()
      },

      deleteTextProject: (id) => {
        set(s => ({ projects: s.projects.filter(p => p.id !== id) }))
        scheduleDriveSync()
      },

      newTextProjectId: () => {
        const nums = get().projects.map(p => parseInt(p.id.replace('proj-', '')) || 0)
        return `proj-${String(Math.max(0, ...nums) + 1).padStart(3, '0')}`
      },
    }),
    { name: 'text-project-store', storage: legacyStorage }
  )
)

// ── Backwards-compatible non-hook accessors ───────────────────────────────────
export const getTextProjects    = ()    => useTextProjectStore.getState().projects
export const saveTextProject    = (p)   => useTextProjectStore.getState().saveTextProject(p)
export const deleteTextProject  = (id)  => useTextProjectStore.getState().deleteTextProject(id)
export const newTextProjectId   = ()    => useTextProjectStore.getState().newTextProjectId()
