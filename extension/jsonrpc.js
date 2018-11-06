export function nativeJsonrpc(endpoint) {
  let port = chrome.runtime.connectNative('io.github.jamespic.ia_extension')
  return jsonRpc(port)
}

export function jsonRpc(port) {
  let awaitingRequests = {}
  port.onMessage.addListener(({id, result, error}) => {
    if (id in awaitingRequests) {
      if (error != null) awaitingRequests[id].reject(new Error(error))
      else awaitingRequests[id].resolve(result)
    }
  })
  return new Proxy({}, {
    get(target, method, receiver) {
      return function proxyHandler() {
        let id = Math.floor(Math.random() * 1000000000000)
        let params = Array.prototype.slice.call(arguments)
        return new Promise((resolve, reject) => {
          awaitingRequests[id] = {resolve, reject}
          port.postMessage({id, method, params, jsonrpc: '2.0'})
        })
      }
    }
  })
}
