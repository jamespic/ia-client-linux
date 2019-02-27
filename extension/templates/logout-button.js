import h from 'hyperscript'

export default function logoutButton(state, emit) {
  return h('div.mb1',
    h('button.br2.pa1.mb1', {onclick: () => emit('logoff')}, 'Logoff')
  )
}
