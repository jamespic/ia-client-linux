export default function createEffects(auth, permission) {
  return function effects(state, emitter, app) {
    state.status = {unlocked: false, card_present: false}

    async function refreshStatus() {
      let status = await auth.status()
      state.status = status
      emitter.emit('render')
    }
    emitter.on('refresh-status', refreshStatus)
    refreshStatus()

    emitter.on('enter-pin', async (pin) => {
      await loginTaskWrapper(async () => {
        let uid = await auth.unlock(pin)
        state.status.uid = uid
        state.status.unlocked = true
      })
      emitter.emit('render')
    })

    emitter.on('select-environment', async (environment) => {
      await loginTaskWrapper(async () => {
        let {token, roles} = await auth.login(environment)
        state.status.token = token
        state.status.roles = roles
      })
      emitter.emit('render')
    })

    emitter.on('select-role', async (role) => {
      await loginTaskWrapper(async () => {
        await auth.select_role(role)
        state.status.role = role
      })
      emitter.emit('render')
    })

    emitter.on('logoff', async () => {
      await auth.logoff()
      emitter.emit('refresh-status')
    })

    emitter.on('dismiss-error', async () => {
      state.error = undefined
      emitter.emit('render')
    })

    async function loginTaskWrapper(action) {
      state.waiting = true
      emitter.emit('render')
      try {
        let result = await action()
        state.error = undefined
        return result
      } catch (e) {
        console.log(e)
        state.error = e
        auth.logoff()
      } finally {
        state.waiting = false
        emitter.emit('render')
      }
    }
  }
}
