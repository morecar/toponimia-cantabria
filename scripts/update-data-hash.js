#!/usr/bin/env node
// Computes a SHA-256 of the data[] array in public/data.json,
// writes the hash back into data.json and into public/data-hash.json.
// Run automatically via predeploy and the GitHub Actions workflow.

const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const dataPath = path.join(__dirname, '../public/data.json')
const hashPath = path.join(__dirname, '../public/data-hash.json')

const content = JSON.parse(fs.readFileSync(dataPath, 'utf8'))

// Hash only the data array so the hash field itself is not part of the input
const hash = crypto
  .createHash('sha256')
  .update(JSON.stringify(content.data))
  .digest('hex')
  .slice(0, 12)

content.hash = hash
fs.writeFileSync(dataPath, JSON.stringify(content, null, 2) + '\n')
fs.writeFileSync(hashPath, JSON.stringify({ hash }) + '\n')

console.log(`data hash: ${hash}`)
