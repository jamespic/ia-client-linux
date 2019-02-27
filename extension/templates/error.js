import h from 'hyperscript'

export default function error(state, emit) {
  return h('div',
    h('h1.f4.mb1', 'Error'),
    h('p.mb1', state.error.toString()),
    h('button.br2.pa1.mb1', {onclick: () => emit('dismiss-error')}, 'Dismiss')
  )
}
