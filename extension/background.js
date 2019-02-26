import {nativeJsonrpc, jsonRpcListen} from './jsonrpc'
import attachHeaderHandler from './headers-hack'
attachHeaderHandler()
window.auth = nativeJsonrpc('io.github.jamespic.ia_extension')
jsonRpcListen(window.auth, 'AUTH')
