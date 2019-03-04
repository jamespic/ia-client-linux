import {readFileSync} from 'fs'
import {localJsonrpc} from './jsonrpc'

var s = document.createElement('script');
s.textContent = readFileSync('./dist/injected.js', 'utf-8')
s.onload = function() {
    this.parentNode.removeChild(this);
};
(document.head||document.documentElement).appendChild(s);

let tokenGuardian = localJsonrpc(null, 'TOKEN_GUARDIAN')

window.addEventListener('message', async (event) => {
  if (event.source === window && event.data.type === 'TOKEN_REQUEST') {
    try {
      let token = await tokenGuardian.requestApproval(window.origin)
      window.postMessage({type: 'TOKEN_APPROVED', token})
    } catch (error) {
      window.postMessage({type: 'TOKEN_DENIED', error})
    }
  }
})
