import base64
import os
import re
import ssl

from urllib.request import urlopen, Request
from urllib.parse import quote


ENVIRONMENTS = {
  'live': 'https://gas.national.ncrs.nhs.uk',
  'dep': 'https://gas.vn1.national.ncrs.nhs.uk',
  'training': 'https://gas.tsp.national.ncrs.nhs.uk',
  'dev': 'https://gas.vn03.national.ncrs.nhs.uk',
  'int': 'https://gas.nis1.national.ncrs.nhs.uk',
}

HEADERS = {
    'User-Agent': 'Mozilla/4.0(compatible;IE;GACv7. 2. 2. 16)'
}

SIGNATURE_RE = re.compile(rb'<gpPARAM name="signature">([^<]+)<\/gpPARAM>')
CHALLENGE_RE = re.compile(rb'<gpPARAM name="challenge">([^<]+)<\/gpPARAM>')
ROLE_RE = re.compile(rb'<gpPARAM name="nhsjobrole\d+" id="([^"]+)" orgcode="([^"]+)">([^<]+)<\/gpPARAM>')
TOKEN_RE = re.compile(rb'<gpPARAM name="sso_ticket">([^<]+)<\/gpPARAM>')
LOGOUT_RE = re.compile(rb'<gpPARAM name="sso_logout_url">([^<]+)<\/gpPARAM>')

def find_param(param_name, data):
    rex = re.compile(rb'<gpPARAM name="%s">([^<]+)<\/gpPARAM>' % param_name.encode('ascii'))
    return rex.search(data).group(1)



ssl_ctx = ssl.create_default_context(
    ssl.Purpose.SERVER_AUTH,
    cafile=os.path.join(os.path.dirname(__file__), 'certs.pem')
)


def identifier():
    return base64.b64encode(os.urandom(6))


class AuthFacade:
    def __init__(self, card_api):
        self._card_api = card_api
        self.token = None
        self.session = None
        self.uid = None
        self.role = None
        self._logout_url = None

    def unlock(self, pin):
        self.uid = self._card_api.login(pin)
        return self.uid

    def login(self, env='live'):
        self.endpoint = ENVIRONMENTS[env]
        self.session = identifier()
        with urlopen(
            Request(
                url="{self.endpoint}/login/authactivate".format(self=self),
                data=b'''<?xml version="1.0" encoding="UTF-8"?>
                    <!DOCTYPE USER SYSTEM "gpOBJECT.DTD">
                    <gpOBJECT>
                    <gpPARAM name="auth_method">3</gpPARAM>
                    <gpPARAM name="app_url">NHST</gpPARAM>
                    <gpPARAM name="log_session_id">%s</gpPARAM>
                    <gpPARAM name="device_id">%s,ClientIP=127.0.0.1</gpPARAM>
                    <gpPARAM name="service">ACTIVATION</gpPARAM>
                    </gpOBJECT>''' % (self.session, self.session),
                headers=HEADERS
            ), context=ssl_ctx
        ) as activate_result:
            activate_data = activate_result.read()
            incoming_signature = find_param('signature', activate_data)
            challenge = find_param('challenge', activate_data)

            challenge_response = self._card_api.sign(challenge)

        with urlopen(
            Request(
                url="{self.endpoint}/login/authvalidate".format(self=self),
                data=b'''<?xml version="1.0" encoding="UTF-8"?>
                         <!DOCTYPE USER SYSTEM "gpOBJECT.DTD">
                         <gpOBJECT>
                         <gpPARAM name="auth_method">3</gpPARAM>
                         <gpPARAM name="app_url">NHST</gpPARAM>
                         <gpPARAM name="log_session_id">%s</gpPARAM>
                         <gpPARAM name="device_id">%s,ClientIP=127.0.0.1</gpPARAM>
                         <gpPARAM name="service">AUTHENTICATION</gpPARAM>
                         <gpPARAM name="challenge">%s</gpPARAM>
                         <gpPARAM name="signature">%s</gpPARAM>
                         <gpPARAM name="uid">%s</gpPARAM>
                         <gpPARAM name="card_type">p11</gpPARAM>
                         <gpPARAM name="response" encoding="base64">%s</gpPARAM>
                         <gpPARAM name="mobility">0</gpPARAM>
                         </gpOBJECT>''' % (
                             self.session,
                             self.session,
                             challenge,
                             incoming_signature,
                             self.uid.encode('utf-8'),
                             base64.b64encode(challenge_response)),
                headers=HEADERS
            ), context=ssl_ctx
        ) as validate_result:
            validate_data = validate_result.read()
            self.roles = {}
            for match in ROLE_RE.finditer(validate_data):
                role_id, org_code, name = match.groups()
                self.roles[role_id.decode('utf-8')] = {
                    'id': role_id.decode('utf-8'),
                    'orgCode': org_code.decode('utf-8'),
                    'name': name.decode('utf-8')
                }

            self.token = find_param('sso_ticket', validate_data).decode('utf-8')
            self._logout_url = find_param('sso_logout_url', validate_data).decode('utf-8')
            return {
                'token': self.token,
                'roles': self.roles
            }

    def select_role(self, role_id):
        with urlopen(
            Request(
                url="{self.endpoint}/saml/RoleSelectionGP.jsp?token={token}&selectedRoleUid={role_id}"
                .format(
                    self=self, token=quote(self.token), role_id=role_id
                ),
                headers=HEADERS
            ), context=ssl_ctx
        ) as result:
            result_data = result.read()
            if b'OK' not in result_data:
                raise Exception(
                    'Failed to select role: {code} {result.statusText}\n{data}'
                    .format(
                        code=result.getcode(), data=result_data.decode('utf-8')
                    )
                )
            self.role = self.roles[role_id]

    def status(self):
        result = {
            'card_present': self._card_api.card_present(),
            'unlocked': self.uid is not None
        }
        if self.uid is not None:
            result['uid'] = self.uid
        if self.token is not None:
            result['token'] = self.token
            result['roles'] = self.roles
        if self.role is not None:
            result['role'] = self.role
        return result

    def get_token(self):
        return self.token

    def logoff(self):
        if self._logout_url:
            with urlopen(
                Request(
                    url=self._logout_url,
                    data=b'''<?xml version="1.0" encoding="UTF-8"?>
                             <!DOCTYPE USER SYSTEM "gpOBJECT.DTD">
                             <gpOBJECT>
                             <gpPARAM name="service">LOGOUT</gpPARAM>
                             <gpPARAM name="sso_ticket">%s</gpPARAM>
                             <gpPARAM name="log_session_id">%s</gpPARAM>
                             <gpPARAM name="device_id">%s,ClientIP=127.0.0.1</gpPARAM>
                             <gpPARAM name="uid">%s</gpPARAM>
                             </gpOBJECT>''' % (
                                 self.token.encode('utf-8'),
                                 self.session,
                                 self.session,
                                 self.uid.encode('utf-8')),
                    headers=HEADERS
                ), context=ssl_ctx
            ) as result:
                result.read()
                self.session = None
                self.token = None
                self.roles = None
                self.role = None
                self._logout_url = None

        if self.uid:
            self._card_api.logout()
            self.uid = None
