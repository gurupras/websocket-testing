<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>
import io from 'socket.io-client'

export default {
  name: 'app',
  mounted () {
    const ws = new WebSocket(`wss://${window.location.host}/websocket`)

    // event emmited when connected
    ws.onopen = function () {
      console.log('websocket is connected ...')
      // sending a send event to websocket server
      ws.send('connected')
    }

    // event emmited when receiving message
    ws.onmessage = function (ev) {
      console.log(ev)
    }
    window.ws = ws

    const socket = io(`wss://${window.location.host}:3230`)
    window.socket = socket
    socket.on('message', (msg) => console.log(JSON.stringify(msg)))
  }
}
</script>
<style lang="scss">
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
#nav {
  padding: 30px;
  a {
    font-weight: bold;
    color: #2c3e50;
    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
