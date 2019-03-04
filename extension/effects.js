export function createAuthEffects(auth) {
  return function authEffects(state, emitter, app) {
    state.status = {unlocked: false, card_present: false}

    async function refreshStatus() {
      await loginTaskWrapper(async () => {
        let status = await auth.status()
        state.status = status
      })
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

export function createTokenGuardianEffects(tokenGuardian, browser) {
  return function tokenGuardianEffects(state, emitter, app) {
    state.originsAwaitingTokens = []
    async function refreshOriginsAwaitingTokens() {
      state.originsAwaitingTokens = await tokenGuardian.originsAwaitingTokens()
      emitter.emit('render')
    }
    refreshOriginsAwaitingTokens()

    emitter.on('approve-token', async (origin) => {
      await tokenGuardian.approveToken(origin)
      refreshOriginsAwaitingTokens()
    })

    emitter.on('deny-token', async (origin) => {
      await tokenGuardian.denyToken(origin)
      refreshOriginsAwaitingTokens()
    })

    emitter.on('logoff', async () => {
      await tokenGuardian.clearApprovals()
    })
  }
}

export default function createEffects(auth, tokenGuardian, browser) {
  return function effects(state, emitter, app) {
    createAuthEffects(auth)(state, emitter, app)
    createTokenGuardianEffects(tokenGuardian, browser)(state, emitter, app)
  }
}
