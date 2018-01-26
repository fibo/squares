const fs = require('fs')
const internalIp = require('internal-ip')
const opn = require('opn')
const path = require('path')
const zlib = require('zlib')

const server = require('http').createServer((req, res) => {
  const { method, url } = req

  switch (method) {
    case 'GET':
      switch (url) {
        case '/':
          res.setHeader('Content-Encoding', 'gzip')
          res.writeHead(200, {'Content-Type': 'text/html; charset=UTF-8'})
          fs.createReadStream(path.join(__dirname, 'index.html'))
            .pipe(zlib.createGzip())
            .pipe(res)
          break

        case '/style.css':
          res.setHeader('Content-Encoding', 'gzip')
          res.writeHead(200, {'Content-Type': 'text/css; charset=UTF-8'})
          fs.createReadStream(path.join(__dirname, 'style.css'))
            .pipe(zlib.createGzip())
            .pipe(res)
          break

        default: res.end()
      } break

    default: res.end()
  }
}).listen(() => {
  const port = server.address().port

  internalIp.v4().then((myIp) => {
    const uri = `http://${myIp}:${port}`

    console.log(`editor server is listening on URI ${uri}`)

    opn(uri)
  }).catch((err) => {
    console.error(err)
    console.log(`editor server is listening on port ${port}`)
  })
})
