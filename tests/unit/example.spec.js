import io from 'socket.io-client'
import stats from 'stats-lite'
import moment from 'moment'

const SERVER_URL = `https://dev.twoseven.xyz:3230`

function setupSocket () {
  const socket = io(SERVER_URL, {
    autoConnect: false
  })
  return new Promise(resolve => {
    socket.on('ready', () => resolve(socket))
    socket.open()
  })
}

describe('Performance Tests', () => {
  let numSockets = 400
  test('Number of connections', async () => {
    let latencies = []
    let sendTime
    const sockets = await Promise.all([...Array(numSockets).keys()].map(x => setupSocket()))
    console.log('Sockets created')
    await Promise.all(sockets.map(socket => new Promise(resolve => socket.emit('join-room', 'test', resolve))))
    console.log('Sockets joined room')
    const promises = sockets.map(socket => new Promise(resolve => socket.on('message', msg => {
      latencies.push(moment().valueOf() - sendTime)
      resolve(msg)
    })))

    sendTime = moment().valueOf()
    const socket = sockets[0]
    socket.emit('message', 'test')

    const messages = await Promise.all(promises)
    messages.forEach(msg => {
      expect(msg.event).toBe('message')
      expect(msg.msg).toBe('test')
      expect(msg.from).toBeTruthy()
    })
    await Promise.all(sockets.map(socket => socket.close()))
    console.warn(`Latencies: avg=${stats.mean(latencies)} median=${stats.median(latencies)} min=${Math.min(...latencies)} max=${Math.max(...latencies)}`)
  }, 300000)
})
