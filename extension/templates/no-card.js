import h from 'hyperscript'

export default function noCard(state, emit) {
  return h('div',
    h('h1.f3.mb1', 'Identity Agent'),
    h('h1.f4.mb1', 'Card Not Found'),
    h('p.mb1', 'Please connect your card readed and insert your smartcard before continuing'),
    h('button.br2.pa1.mb1', {onclick: () => emit('refresh-status')}, "I'm ready")
  )
}
