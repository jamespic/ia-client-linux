export function nativeJsonrpc(endpoint) {
  let port = chrome.runtime.connectNative('io.github.jamespic.ia_extension')
  return jsonRpc(port)
}

export function localJsonrpc(extension, name) {
  let extensionId = extension || chrome.runtime.id
  let port = chrome.runtime.connect(extensionId, {name})
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

export function jsonRpcServer(port, handler) {
  port.onMessage.addListener(async ({id, method, params}) => {
    try {
      let result = await handler[method].apply(handler, params)
      port.postMessage({id, result, error: null, jsonrpc: '2.0'})
    } catch (e) {
      port.postMessage({id, result: null, error: {msg: e.toString(), stack: e.stack}, jsonrpc: '2.0'})
    }
  })
}

export function jsonRpcListen(handler, name) {
  chrome.runtime.onConnect.addListener(port => {
    if (port.name === name) jsonRpcServer(port, handler)
  })
}
