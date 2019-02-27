import h from 'hyperscript'
import logoutButton from './logout-button'

export default function unlock(state, emit) {
  return h('div',
    h('h1.f3.mb1', 'Identity Agent'),
    h('h2.f4.mb1', 'Select Environment'),
    h('div.mb1',
      h(
        'select.br2.w4.pa1.mb1#environment',
        {onchange: (e) => emit('select-environment', e.target.value)},
        h('option', {disabled: true, selected: true, hidden: true, value: ''}),
        ['live', 'dep', 'training', 'dev', 'int'].map(env =>
          h('option', {value: env}, env)
        )
      )
    ),
    logoutButton(state, emit)
  )
}
