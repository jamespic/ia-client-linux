import {nativeJsonrpc, jsonRpcListen} from './jsonrpc'
import TokenGuardian from './token-guardian'
window.auth = nativeJsonrpc('io.github.jamespic.ia_extension')
window.tokenGuardian = new TokenGuardian(auth, chrome)
jsonRpcListen(window.auth, 'AUTH')
jsonRpcListen(window.tokenGuardian, 'TOKEN_GUARDIAN')
