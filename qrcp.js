#!/usr/bin/env node

const fs = require('fs')
const os = require('os')
const http = require('http')

const version = require('./package.json')['version']
const chalk = require('chalk')
const program = require('commander')
const qrcode = require('qrcode-terminal')

program
  .version(version)
  .option(
    '-f, --forever',
    "Don't stop server after file is downloaded. Useful for transferring the same file to multiple destinations.",
  )
  .parse(process.argv)

const [filename, ...args] = program.args
if (!filename) {
  program.outputHelp()
  process.exit(1)
}

let stat
try {
  stat = fs.statSync(filename)
} catch (err) {
  program.outputHelp()
  process.exit(1)
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
    if (!program.forever) {
      res.on('finish', () => process.exit())
    }
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
