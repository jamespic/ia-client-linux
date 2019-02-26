import h from 'hyperscript'

export default function unlock(state, emit) {
  let pin = ''
  return h('div',
    h('form', {onsubmit: () => emit('enter-pin', pin)},
      h('label', {'for': 'pin'}),
      h('input', {id: 'pin', type: 'password', onchange: (e) => {pin = e.target.value}}),
      h('button', {type: 'submit'}, 'Unlock')
    )
  )
}
