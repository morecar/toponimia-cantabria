#!/usr/bin/env node
// Copies data files from the data/ worktree into public/ before build,
// and updates public/data-hash.json with the git blob SHA of toponyms.json.

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const DATA_DIR = path.join(__dirname, '../data')
const PUBLIC_DIR = path.join(__dirname, '../public')

const FILES = [
  'toponyms.json',
  'toponyms-hash.json',
  'etymologies.json',
  'etymologies-hash.json',
  'attestations.json',
  'attestations-hash.json',
]

for (const file of FILES) {
  const src = path.join(DATA_DIR, file)
  const dst = path.join(PUBLIC_DIR, file)
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst)
    console.log(`copied ${file}`)
  }
}

// Also update data-hash.json (used by older cache logic)
const hashPath = path.join(PUBLIC_DIR, 'data-hash.json')
const line = execSync('git ls-tree origin/data toponyms.json').toString().trim()
const hash = line.split(/\s+/)[2].slice(0, 12)
fs.writeFileSync(hashPath, JSON.stringify({ hash }) + '\n')
console.log(`data hash: ${hash}`)
