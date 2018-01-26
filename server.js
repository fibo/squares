const fs = require('fs')
const internalIp = require('internal-ip')
const opn = require('opn')
const path = require('path')
const zlib = require('zlib')

let numUsers = 0

const file = path.join.bind(path, __dirname)

const server = require('http').createServer((req, res) => {
  const { method, url } = req

  switch (method) {
    case 'GET':
      switch (url) {
        case '/':
          res.setHeader('Content-Encoding', 'gzip')
          res.writeHead(200, {'Content-Type': 'text/html; charset=UTF-8'})
          fs.createReadStream(file('index.html'))
            .pipe(zlib.createGzip())
            .pipe(res)
          break

        case '/client.js':
          res.setHeader('Content-Encoding', 'gzip')
          res.writeHead(200, {'Content-Type': 'application/javascript'})
          fs.createReadStream(file('client.js'))
            .pipe(zlib.createGzip())
            .pipe(res)
          break

        case '/style.css':
          res.setHeader('Content-Encoding', 'gzip')
          res.writeHead(200, {'Content-Type': 'text/css; charset=UTF-8'})
          fs.createReadStream(file('style.css'))
            .pipe(zlib.createGzip())
            .pipe(res)
          break

        default: res.end()
      } break

    default: res.end()
  }
}).listen(() => {
  const port = server.address().port

  internalIp.v4().then(myIp => {
    const uri = `http://${myIp}:${port}`

    console.log(`server is listening on URI ${uri}`)

    opn(uri)
  }).catch(err => {
    console.error(err)
    console.log(`server is listening on port ${port}`)
  })
})

let boxOf = {}
let registered = {}

const io = require('socket.io')(server).on('connection', socket => {
  socket.on('register', clientId => {
    console.log(`register clientId ${clientId}, numUsers is ${numUsers}`)
    socket.clientId = clientId

    registered[clientId] = true
    numUsers = Object.keys(registered).length
    io.emit('count', numUsers)

    socket.emit('sync', boxOf)
  })

  socket.on('desire', boxId => {
    const clientId = socket.clientId

    const previousBoxId = boxOf[clientId]

    let currentOwner = null

    if (previousBoxId === boxId) {
      io.emit('run', boxId)
    } else {
      // Look for box owner.
      Object.keys(boxOf).forEach(userId => {
        if (boxId === boxOf[userId]) {
          currentOwner = userId
        }
      })

      // No owner was found, client desire can be fulfilled.
      if (currentOwner === null) {
        boxOf[clientId] = boxId
        socket.emit('select', boxId)
        socket.broadcast.emit('lock', boxId)

        if (previousBoxId) {
          io.emit('unlock', previousBoxId)
        }
      }
    }
  })

  socket.on('disconnect', () => {
    const clientId = socket.clientId

    const boxId = boxOf[clientId]
    socket.broadcast.emit('unlock', boxId)
    delete boxOf[socket.id]

    delete registered[clientId]
    numUsers = Object.keys(registered).length
    socket.broadcast.emit('count', numUsers)

    console.log(`client ${clientId} disconnected, numUsers is ${numUsers}`)
  })
})
