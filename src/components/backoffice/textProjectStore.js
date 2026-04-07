const KEY = 'textProjects_v1'

export function getTextProjects() {
  try { return JSON.parse(localStorage.getItem(KEY)) || [] }
  catch { return [] }
}

export function saveTextProject(project) {
  const all = getTextProjects()
  const idx = all.findIndex(p => p.id === project.id)
  if (idx >= 0) all[idx] = project
  else all.push(project)
  localStorage.setItem(KEY, JSON.stringify(all))
}

export function deleteTextProject(id) {
  localStorage.setItem(KEY, JSON.stringify(getTextProjects().filter(p => p.id !== id)))
}

export function newTextProjectId() {
  const nums = getTextProjects().map(p => parseInt(p.id.replace('proj-', '')) || 0)
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1
  return `proj-${String(next).padStart(3, '0')}`
}
