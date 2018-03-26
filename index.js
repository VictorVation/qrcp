#!/usr/bin/env node

const fs = require('fs')
const os = require('os')
const http = require('http')

const chalk = require('chalk')
const qrcode = require('qrcode-terminal')

function exitHelp() {
  console.log(`qrcp - Transfer files via QR code through the local network.
Usage:
  qrcp <filename>`)
  process.exit(1)
}

const filename = process.argv[2]
if (!filename) {
  exitHelp()
}

let stat
try {
  stat = fs.statSync(filename)
} catch (err) {
  exitHelp()
}

if (stat.isDirectory()) {
  console.log(`Skipping directory ${filename}.`)
  process.exit(1)
}

const server = http
  .createServer((req, res) => {
    res.writeHead('200', {
      'Content-Length': stat.size,
      'Content-Disposition': 'attachment; filename=' + filename,
    })
    res.on('finish', () => process.exit())
    fs.createReadStream(filename).pipe(res)
  })
  .listen()

server.on('listening', () => {
  const uri = 'http://' + os.hostname + ':' + server.address().port
  console.log(chalk`
{yellow ${filename} is now temporarily available on your local network!
Scan the following QR code to download the file, or visit} {cyan.underline ${uri}}{yellow .}
{yellow Make sure your phone is connected to the same WiFi network as this computer.}
`)
  qrcode.generate(uri)
})
