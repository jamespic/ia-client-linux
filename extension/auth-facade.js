const environments = {
  live: 'https://gas.national.ncrs.nhs.uk',
  dep: 'https://gas.vn1.national.ncrs.nhs.uk',
  training: 'https://gas.tsp.national.ncrs.nhs.uk',
  dev: 'https://gas.vn03.national.ncrs.nhs.uk',
  int: 'https://gas.nis1.national.ncrs.nhs.uk',
}

function identifier() {
  let buf = new Uint8Array(6)
  window.crypto.getRandomValues(buf)
  return btoa(String.fromCharCode(...buf));
}

class AuthFacade {
  constructor(cardApi, env = 'live') {
    this._cardApi = cardApi
    this.endpoint = environments[env]
    this.token = null
    this.session = null
    this.uid = null
  }

  async logon(pin) {
    this.session = identifier()
    let activateResult = await fetch(
      `${this.endpoint}/login/authactivate`, {
        method: 'POST',
        body: `<?xml version="1.0" encoding="UTF-8"?>
        <!DOCTYPE USER SYSTEM "gpOBJECT.DTD">
        <gpOBJECT>
        <gpPARAM name="auth_method">3</gpPARAM>
        <gpPARAM name="app_url">NHST</gpPARAM>
        <gpPARAM name="log_session_id">${this.session}</gpPARAM>
        <gpPARAM name="device_id">${this.session},ClientIP=127.0.0.1</gpPARAM>
        <gpPARAM name="service">ACTIVATION</gpPARAM>
        </gpOBJECT>`
      }
    )
    let activateData = await activateResult.text()
    let incomingSignature = /<gpPARAM name="signature">([^<]+)<\/gpPARAM>/.exec(activateData)[1]
    let challenge = /<gpPARAM name="challenge">([^<]+)<\/gpPARAM>/.exec(activateData)[1]

    this.uid = await this._cardApi.login(pin)
    let challengeResponse = await this._cardApi.sign(challenge)

    let validateResult = await fetch(
      `${this.endpoint}/login/authvalidate`, {
        method: 'POST',
        body: `<?xml version="1.0" encoding="UTF-8"?>
        <!DOCTYPE USER SYSTEM "gpOBJECT.DTD">
        <gpOBJECT>
        <gpPARAM name="auth_method">3</gpPARAM>
        <gpPARAM name="app_url">NHST</gpPARAM>
        <gpPARAM name="log_session_id">${this.session}</gpPARAM>
        <gpPARAM name="device_id">${this.session},ClientIP=127.0.0.1</gpPARAM>
        <gpPARAM name="service">AUTHENTICATION</gpPARAM>
        <gpPARAM name="challenge">${challenge}</gpPARAM>
        <gpPARAM name="signature">${incomingSignature}</gpPARAM>
        <gpPARAM name="uid">${this.uid}</gpPARAM>
        <gpPARAM name="card_type">p11</gpPARAM>
        <gpPARAM name="response" encoding="base64">${btoa(challengeResponse)}</gpPARAM>
        <gpPARAM name="mobility">0</gpPARAM>
        </gpOBJECT>`
      }
    )
    let validateData = await validateResult.text()
    this.roles = {}
    let re = /<gpPARAM name="nhsjobrole\d+" id="([^"]+)" orgcode="([^"]+)">([^<]+)<\/gpPARAM>/g
    let match
    while ((match = re.exec(validateData)) !== null) {
      let [_, id, orgcode, name] = match
      this.roles[id] = {
        id: id,
        orgCode: orgcode,
        name: name
      }
    }
    this.token = /<gpPARAM name="sso_ticket">([^<]+)<\/gpPARAM>/.exec(validateData)[1]
    this._logoutUrl = /<gpPARAM name="sso_logout_url">([^<]+)<\/gpPARAM>/.exec(validateData)[1]
    return {
      token: this.token,
      roles: this.roles
    }
  }

  async selectRole(roleId) {
    let result = await fetch(
      `${this.endpoint}/saml/RoleSelectionGP.jsp?token=${encodeURIComponent(this.token)}&selectedRoleUid=${roleId}`
    )
    let resultData = await result.text()
    if (!resultData.includes('OK')) {
      throw Error(`Failed to select role: ${result.status} ${result.statusText}\n${resultData}`)
    }
    this.role = this.roles[roleId]
  }

  async logoff() {
    let result = await fetch(this._logoutUrl, {
      method: 'POST',
      data: `<?xml version="1.0" encoding="UTF-8"?>
        <!DOCTYPE USER SYSTEM "gpOBJECT.DTD">
        <gpOBJECT>
        <gpPARAM name="service">LOGOUT</gpPARAM>
        <gpPARAM name="sso_ticket">${this.token}</gpPARAM>
        <gpPARAM name="log_session_id">${this.session}</gpPARAM>
        <gpPARAM name="device_id">${this.session},ClientIP=127.0.0.1</gpPARAM>
        <gpPARAM name="uid">${this.uid}</gpPARAM>
        </gpOBJECT>`
    })
  }
}

export default AuthFacade
