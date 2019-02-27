import h from 'hyperscript'

export default function unlock(state, emit) {
  let pin = ''
  return h('div',
    h('h1.f3.mb1', 'Identity Agent'),
    h('h2.f4.mb1', 'Enter PIN'),
    h('form', {onsubmit: () => emit('enter-pin', pin)},
      h('div.mb1',
        h('input.br2.w4.pa1.mb1#pin', {type: 'password', onchange: (e) => {pin = e.target.value}})
      ),
      h('div.mb1',
        h('button.br2.pa1.mb1', {type: 'submit'}, 'Unlock')
      )

    )
  )
}
