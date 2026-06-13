/**
 * Icon generation script
 * Run: node scripts/generate-icon.js
 */

const fs = require('fs')
const path = require('path')

// Simple ICO file header (placeholder)
function createMinimalIco() {
  // This is a minimal 1x1 pixel ICO file
  // Replace with actual icon for production use
  const ico = Buffer.from([
    0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 32, 0, 68, 0,
    0, 0, 22, 0, 0, 0
  ])
  return ico
}

const resourcesDir = path.join(__dirname, '..', 'resources')

// Check if icon exists, if not create placeholder
if (!fs.existsSync(path.join(resourcesDir, 'icon.ico'))) {
  console.log('Creating placeholder icon.ico...')
  fs.writeFileSync(path.join(resourcesDir, 'icon.ico'), createMinimalIco())
  console.log('Created placeholder icon.ico')
  console.log('Please replace resources/icon.ico with your actual icon')
}

console.log('\nIcon setup complete!')
console.log('For production builds, replace icons in resources/ directory')
