#!/usr/bin/env node
// Uses the git blob SHA of public/data.json in origin/data as the data version.
// This is a cryptographic hash of the file content, stable and automatic —
// changes only when data.json changes, not when other files in the branch do.

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const hashPath = path.join(__dirname, '../public/data-hash.json')

// git ls-tree prints: <mode> blob <sha>\t<path>
const line = execSync('git ls-tree origin/data data.json').toString().trim()
const hash = line.split(/\s+/)[2].slice(0, 12)

fs.writeFileSync(hashPath, JSON.stringify({ hash }) + '\n')
console.log(`data hash: ${hash}`)
