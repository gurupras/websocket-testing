require = require('esm')(module)
const url = require('url')
const express = require('express')
const compression = require('compression')
const cors = require('cors')
const bodyParser = require('body-parser')
const httpRewrite = require('http-rewrite-middleware')
const http = require('http')
const https = require('https')

const config = require('../config')
const WebsocketServer = require('ws').Server
const Io = require('socket.io')

const app = express()
app.use(compression())
app.use(cors({
  origin: true
}))
app.use(bodyParser.json())

app.use(httpRewrite.getMiddleware([
  // Strip '/api' from any incoming request
  {
    from: '^/api/(.*)$',
    to: '/$1'
  }
], {
  silent: true
}))

const httpServer = http.createServer(app, (req, res) => {
  res.writeHead(301, { 'Location': 'https://' + req.headers['host'] + req.url })
  res.end()
})

const httpsServer = https.createServer(config.server.https, app)

httpServer.listen(config.server.http_port, () => { console.log(`HTTP server listening on port ${config.server.http_port}`) })
httpsServer.listen(config.server.https_port, () => { console.log(`HTTPS server listening on port ${config.server.https_port}`) })

const io = Io(httpsServer, {
  pingInterval: 30000,
  pingTimeout: 100000
})
io.on('connection', socket => {
  socket.on('message', msg => {
    // console.log(JSON.stringify(msg))
    const rooms = Object.assign({}, socket.rooms)
    delete rooms[socket.id]
    for (const room of Object.keys(rooms)) {
      io.in(room).emit('message', {
        event: 'message',
        from: socket.id,
        msg
      })
    }
  })

  socket.on('join-room', (room, cb) => {
    socket.join(room)
    cb && cb()
  })
  socket.emit('ready')
})

const wss = new WebsocketServer({
  noServer: true,
  path: '/websocket'
})

httpsServer.on('upgrade', (req, sock, head) => {
  const pathname = url.parse(req.url).pathname
  if (pathname.startsWith('/websocket')) {
    wss.handleUpgrade(req, sock, head, ws => {
      wss.emit('connection', ws, req)
    })
  }
})

wss.on('connection', ws => {
  console.log(`Received connection`)

  ws.on('message', msg => {
    console.log(JSON.stringify(msg))
    ws.send(JSON.stringify({
      event: 'message',
      data: msg
    }))
  })
})
