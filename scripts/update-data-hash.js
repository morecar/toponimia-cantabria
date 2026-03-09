#!/usr/bin/env node
// Copies data files from the data/ worktree into public/ before build.

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
]

for (const file of FILES) {
  const src = path.join(DATA_DIR, file)
  const dst = path.join(PUBLIC_DIR, file)
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst)
    console.log(`copied ${file}`)
  }
}

