import h from 'hyperscript'

export default function requestPermission(state, emit) {
  let origin = state.originsAwaitingTokens[0]
  return h('div',
    h('h1.f3.mb1', 'Identity Agent'),
    h('h1.f4.mb1', 'Smartcard Login Requested'),
    h('.mb1',
      h('p', `A service at ${origin} is requesting a smartcard login.`),
      h('p',
        `Be aware that CIS has no concept of login scope. If you log into a service
        with your smartcard, the operators of that service will be able to access
        any other smartcard-secured services that you can access. Do not do this
        unless you trust this service.`
      )
    ),
    h('div.mb1',
      h('button.br2.pa1.mb1', {onclick: () => emit('approve-token', origin)}, "Approve"),
      h('button.br2.pa1.mb1', {onclick: () => emit('decline-token', origin)}, "Decline"),
    )

  )
}
