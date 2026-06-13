/**
 * Generate a valid ICO file from PNG
 * Run: node scripts/create-icon.js
 */

const fs = require('fs')
const path = require('path')

// Create a minimal valid ICO file (16x16, 32-bit)
function createValidIco() {
  // ICO file structure:
  // - Header (6 bytes): Reserved (2), Type (2), Count (2)
  // - Directory entry (16 bytes per image): Width, Height, Colors, Reserved, Planes, BitsPerPixel, Size, Offset
  // - Image data: PNG or BMP data

  // We'll create a simple 1x1 pixel BMP-based ICO
  // BMP Info Header (40 bytes)
  const bmpHeader = Buffer.alloc(40)
  bmpHeader.writeUInt32LE(40, 0)          // biSize
  bmpHeader.writeInt32LE(1, 4)            // biWidth
  bmpHeader.writeInt32LE(2, 8)            // biHeight (doubled for ICO)
  bmpHeader.writeUInt16LE(1, 12)          // biPlanes
  bmpHeader.writeUInt16LE(32, 14)         // biBitCount
  bmpHeader.writeUInt32LE(0, 16)          // biCompression
  bmpHeader.writeUInt32LE(40, 20)         // biSizeImage
  bmpHeader.writeInt32LE(0, 24)           // biXPelsPerMeter
  bmpHeader.writeInt32LE(0, 28)           // biYPelsPerMeter
  bmpHeader.writeUInt32LE(0, 32)          // biClrUsed
  bmpHeader.writeUInt32LE(0, 36)          // biClrImportant

  // Pixel data (1x1 pixel, BGRA)
  const pixelData = Buffer.from([
    0xF6, 0x8B, 0x3B, 0xFF  // Blue, Green, Red, Alpha (orange color #3B82F6)
  ])

  // AND mask (1x1, 1 bit per pixel, padded to 4 bytes)
  const andMask = Buffer.from([0x00, 0x00, 0x00, 0x00])

  const imageData = Buffer.concat([bmpHeader, pixelData, andMask])
  const imageSize = imageData.length

  // ICO Header
  const icoHeader = Buffer.alloc(6)
  icoHeader.writeUInt16LE(0, 0)   // Reserved
  icoHeader.writeUInt16LE(1, 2)   // Type: ICO
  icoHeader.writeUInt16LE(1, 4)   // Count: 1 image

  // Directory entry
  const dirEntry = Buffer.alloc(16)
  dirEntry.writeUInt8(0, 0)       // Width (0 = 256)
  dirEntry.writeUInt8(0, 1)       // Height (0 = 256)
  dirEntry.writeUInt8(0, 2)       // Colors
  dirEntry.writeUInt8(0, 3)       // Reserved
  dirEntry.writeUInt16LE(1, 4)    // Planes
  dirEntry.writeUInt16LE(32, 6)   // Bits per pixel
  dirEntry.writeUInt32LE(imageSize, 8)  // Image size
  dirEntry.writeUInt32LE(22, 12)  // Offset (6 + 16 = 22)

  return Buffer.concat([icoHeader, dirEntry, imageData])
}

const resourcesDir = path.join(__dirname, '..', 'resources')
const icoPath = path.join(resourcesDir, 'icon.ico')

if (!fs.existsSync(icoPath)) {
  console.log('Creating valid icon.ico...')
  const ico = createValidIco()
  fs.writeFileSync(icoPath, ico)
  console.log(`Created icon.ico (${ico.length} bytes)`)
  console.log('For production, replace with your actual icon')
} else {
  console.log('icon.ico already exists')
}
