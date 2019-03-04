import {version} from './package.json'

window.nhsAuth = {
  getToken(callback) {
    window.addEventListener('message', function handleMessage(event) {
      if (event.source !== window) return
      switch (event.data.type) {
        case 'TOKEN_APPROVED':
          callback(null, event.data.token)
          window.removeEventListener(message, handleMessage)
          return
        case 'TOKEN_DENIED':
          callback(event.data.error)
          window.removeEventListener(message, handleMessage)
          return
      }
    })
    window.postMessage({type: 'TOKEN_REQUEST'})
  },
  getTokenNoAuth(callback) {callback('getTokenNoAuth Not Supported')},
  getAdapterVersion(callback) {callback(null, version)},
  getBridgeVersion(callback) {callback(null, version)}
}
