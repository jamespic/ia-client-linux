import h from 'hyperscript'
import logoutButton from './logout-button'

export default function loggedIn(state, emit) {
  return h('div',
    h('h1.f3.mb1', 'Identity Agent'),
    h('h2.f4.mb1', 'Select Role'),
    h('div.mb1',
      h('select.br2.w4.pa1.mb1',
        {onchange: (e) => emit('select-role', e.target.value)},
        h('option', {disabled: true, selected: state.status.role == null, hidden: true, value: ''}),
        Object.values(state.status.roles).map(({id, orgCode, name}) =>
          h('option', {value: id}, `${name} (${orgCode}, ${id})`)
        )
      )
    ),
    logoutButton(state, emit)
  )
}
