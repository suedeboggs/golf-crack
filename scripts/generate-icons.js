/**
 * Generates PNG icon files from public/icon.svg using the system's canvas API.
 * Run with: node scripts/generate-icons.js
 *
 * Requires: npm install --save-dev @napi-rs/canvas
 * (or skip and manually export the SVG to PNG at 192×192 and 512×512)
 */

import { createCanvas, loadImage } from '@napi-rs/canvas'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root      = join(__dirname, '..')
const svgPath   = join(root, 'public', 'icon.svg')
const iconsDir  = join(root, 'public', 'icons')

mkdirSync(iconsDir, { recursive: true })

async function generate(size, filename) {
  const canvas = createCanvas(size, size)
  const ctx    = canvas.getContext('2d')
  const img    = await loadImage(readFileSync(svgPath))
  ctx.drawImage(img, 0, 0, size, size)
  writeFileSync(join(iconsDir, filename), canvas.toBuffer('image/png'))
  console.log(`✓ ${filename} (${size}×${size})`)
}

await generate(180, 'apple-touch-icon.png')
await generate(192, 'icon-192.png')
await generate(512, 'icon-512.png')
console.log('Icons generated in public/icons/')
