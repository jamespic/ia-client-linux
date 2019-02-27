import {localJsonrpc} from './jsonrpc'
import choo from 'choo'
import error from './templates/error'
import waiting from './templates/waiting'
import unlock from './templates/unlock'
import selectEnvironment from './templates/select-environment'
import requestPermission from './templates/request-permission'
import loggedIn from './templates/logged-in'
import createEffects from './effects'

let auth = localJsonrpc(null, 'AUTH')
let permission = localJsonrpc(null, 'PERMISSION')

let app = choo()

app.use(createEffects(auth, permission))

function mainRoute(state, emit) {
  if (state.error) {return error(state, emit)}
  else if (state.waiting) {return waiting(state, emit)}
  else if (!state.status.unlocked) {return unlock(state, emit)}
  else if (state.status.token == null) {return selectEnvironment(state, emit)}
  else if (false /* FIXME: handle permissions */) {return requestPermission(state, emit)}
  else {return loggedIn(state, emit)}
}

app.route('/popup.html', mainRoute)
app.mount('#main')
