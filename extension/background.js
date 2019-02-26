import {nativeJsonrpc, jsonRpcListen} from './jsonrpc'
import attachHeaderHandler from './headers-hack'
import AuthFacade from './auth-facade'
attachHeaderHandler()
window.card = nativeJsonrpc('io.github.jamespic.ia_extension')
window.auth = new AuthFacade(window.card)
jsonRpcListen(window.auth, 'AUTH')
