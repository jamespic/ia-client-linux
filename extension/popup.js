import {localJsonrpc} from './jsonrpc'
import choo from 'choo'
import noCard from './templates/no-card'
import error from './templates/error'
import waiting from './templates/waiting'
import unlock from './templates/unlock'
import selectEnvironment from './templates/select-environment'
import requestPermission from './templates/request-permission'
import loggedIn from './templates/logged-in'
import createEffects from './effects'

let auth = localJsonrpc(null, 'AUTH')
let tokenGuardian = localJsonrpc(null, 'TOKEN_GUARDIAN')

let app = choo()

app.use(createEffects(auth, tokenGuardian, chrome))

function mainRoute(state, emit) {
  if (state.error) {return error(state, emit)}
  else if (state.waiting) {return waiting(state, emit)}
  else if (!state.status.card_present) {return noCard(state, emit)}
  else if (!state.status.unlocked) {return unlock(state, emit)}
  else if (state.status.token == null) {return selectEnvironment(state, emit)}
  else if (state.originsAwaitingTokens.length > 0 && state.status.role != null) {return requestPermission(state, emit)}
  else {return loggedIn(state, emit)}
}

app.route('/popup.html', mainRoute)
app.mount('#main')
