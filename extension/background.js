import {nativeJsonrpc, jsonRpcListen} from './jsonrpc'
window.auth = nativeJsonrpc('io.github.jamespic.ia_extension')
jsonRpcListen(auth, 'AUTH')

chrome.storage.local.get({permittedOrigins: {}}, function({permittedOrigins}) {
  let awaitingPermissions = new Set()
  let permissionHandler = {
    awaitingPermissions() {return Promise.resolve(awaitingPermissions)},
    decidePermission(origin, permitted) {
      permittedOrigins[origin] = permitted
      awaitingPermissions.delete(origin)
      broadcastPermission(origin)
      chrome.storage.local.set({permittedOrigins})
    }
  }
  jsonRpcListen(permissionHandler, 'PERMISSION')

  function broadcastPermission(origin) {
    chrome.runtime.sendMessage(undefined, {
      type: 'PERMISSION_RESPONSE',
      origin,
      permitted: permittedOrigins[origin]
    })
  }

  chrome.runtime.onMessage.addListener(({type, origin}) => {
    if (type === 'PERMISSION_REQUEST') {
      if (origin in permittedOrigins) broadcastPermission(origin)
      else {
        awaitingPermissions.add(origin)
        // FIXME: Pop up a request for permissions
      }
    }
  })
})
