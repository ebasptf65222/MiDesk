const fs = require('fs')
const path = require('path')
const https = require('https')
const http = require('http')

// Configuration
const CLI_PATH = 'D:\\桌面\\mimocode-windows-x64\\mimo.exe'
const UPLOAD_URL = process.env.UPLOAD_URL || 'https://your-upload-server.com/upload'
const API_KEY = process.env.UPLOAD_API_KEY || ''

async function uploadCLI() {
  console.log('Uploading MiMo CLI...')
  console.log('Source:', CLI_PATH)
  
  if (!fs.existsSync(CLI_PATH)) {
    console.error('CLI file not found:', CLI_PATH)
    process.exit(1)
  }

  const fileStats = fs.statSync(CLI_PATH)
  console.log('File size:', (fileStats.size / 1024 / 1024).toFixed(2), 'MB')

  const fileStream = fs.createReadStream(CLI_PATH)
  const url = new URL(UPLOAD_URL)
  
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Length': fileStats.size,
      'Authorization': `Bearer ${API_KEY}`
    }
  }

  return new Promise((resolve, reject) => {
    const protocol = url.protocol === 'https:' ? https : http
    const req = protocol.request(options, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('Upload successful!')
          console.log('Response:', data)
          resolve(data)
        } else {
          console.error('Upload failed with status:', res.statusCode)
          console.error('Response:', data)
          reject(new Error(`Upload failed: ${res.statusCode}`))
        }
      })
    })

    req.on('error', (err) => {
      console.error('Upload error:', err)
      reject(err)
    })

    fileStream.pipe(req)
  })
}

uploadCLI()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Failed:', err)
    process.exit(1)
  })