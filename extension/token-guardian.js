export default class TokenGuardian {
  constructor(auth, browser) {
    this._originsAwaitingTokens = new Set()
    this._originTokenApprovals = {}
    this._auth = auth
    this._browser = browser
  }

  async originsAwaitingTokens() {
    return Array.from(this._originsAwaitingTokens)
  }

  async declineToken(origin) {
    this._originsAwaitingTokens.delete(origin)
    this._originTokenApprovals[origin].reject('Token request rejected')
  }

  async approveToken(origin) {
    let token = await this._auth.get_token()
    this._originsAwaitingTokens.delete(origin)
    this._originTokenApprovals[origin].resolve(token)
  }

  async requestApproval(origin) {
    if (origin in this._originTokenApprovals) {
      return await this._originTokenApprovals[origin].promise
    } else {
      let approvalsObject = (this._originTokenApprovals[origin] = {})
      approvalsObject.promise = new Promise((resolve, reject) => {
        approvalsObject.resolve = resolve
        approvalsObject.reject = reject
      })
      this._originsAwaitingTokens.add(origin)
      this._browser.windows.create({
        url: '/popup.html',
        type: 'popup',
        width: 400,
        height: 480
      })
      return approvalsObject.promise
    }
  }

  async clearApprovals() {
    this._originsAwaitingTokens = new Set()
    this._originTokenApprovals = {}
  }
}
