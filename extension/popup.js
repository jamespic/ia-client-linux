import {localJsonrpc} from './jsonrpc'
import choo from 'choo'
import unlock from './templates/unlock'
import selectEnvironment from './templates/select-environment'
import requestPermission from './templates/request-permission'
import loggedIn from './templates/logged-in'

let auth = localJsonrpc(null, 'AUTH')
let permission = localJsonrpc(null, 'PERMISSION')

let app = choo()

app.use((state, emitter) => {
  emitter.on('enter-pin', async (pin) => {
    console.log('PIN', pin)
    let uid = await auth.unlock(pin)
    state.status.uid = uid
    state.status.unlocked = true
    emitter.emit('render')
  })
})

app.use((state, emitter) => {
  emitter.on('select-environment', async (environment) => {
    console.log('environment', environment)
    let {token, roles} = await auth.login(pin)
    state.status.token = token
    state.status.roles = roles
    emitter.emit('render')
  })
})

app.use((state, emitter) => {
  state.status = {unlocked: false}
  async function refreshStatus() {
    let status = await auth.status()
    state.status = status
    emitter.emit('render')
  }
  emitter.on('refresh-status', refreshStatus)
  refreshStatus()
})

function mainRoute(state, emitter, app) {
  if (!state.status.unlocked) return unlock(state, emitter, app)
  else if (state.status.token == null) return selectEnvironment(state, emitter, app)
  else if (false /* FIXME: handle permissions */) return requestPermission(state, emitter, app)
  else return loggedIn(state, emitter, app)
}

app.route('/popup.html', mainRoute)
app.mount('#main')
