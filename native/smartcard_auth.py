import base64
import PyKCS11

import asn1crypto.algos as algos
import asn1crypto.cms as cms
import asn1crypto.x509 as x509



SMIME_HEADER = """MIME-Version: 1.0
Content-Disposition: attachment; filename="smime.p7m"
Content-Type: application/x-pkcs7-mime; name="smime.p7m"
Content-Transfer-Encoding: base64

"""


class SmartcardAuth:
    def __init__(self):
        self._pkcs = PyKCS11.PyKCS11Lib()
        self._pkcs.load('/usr/lib/ClassicClient/libgclib.so')
        self._uid = None
        self._session = None
        self._cert = None
        self._private_key = None

    def login(self, pin):
        for slot in self._pkcs.getSlotList():
            self._session = self._pkcs.openSession(
                slot,
                PyKCS11.CKF_SERIAL_SESSION | PyKCS11.CKF_RW_SESSION
            )
            self._session.login(pin, PyKCS11.CKU_USER)

            self._private_key = [
                key for key in self._session.findObjects([
                    (PyKCS11.CKA_CLASS, PyKCS11.CKO_PRIVATE_KEY)
                ]) if key.to_dict()['CKA_DECRYPT']
            ][0]
            key_id = self._private_key.to_dict()['CKA_ID']

            auth_cert = self._session.findObjects([
                (PyKCS11.CKA_CLASS, PyKCS11.CKO_CERTIFICATE),
                (PyKCS11.CKA_ID, key_id)
            ])[0].to_dict()
            self._cert = bytes(auth_cert['CKA_VALUE'])
            self._uid = _get_uid_from_subject(bytes(auth_cert['CKA_SUBJECT']))
            return self._uid

    def uid(self):
        return self._uid

    def sign(self, challenge):
            challenge_bin = base64.b64decode(challenge)
            signature = bytes(
                self._session.sign(
                    self._private_key,
                    challenge_bin,
                    PyKCS11.Mechanism(PyKCS11.CKM_SHA1_RSA_PKCS, None)
                )
            )
            return SMIME_HEADER + base64.encodebytes(
                _envelope(challenge_bin, self._cert, signature)
            ).decode('ascii')

    def logout(self):
        self._session.logout()
        self._session.closeSession()


def _get_uid_from_subject(asn1):
    cert = x509.Name.load(asn1)
    return cert.native['common_name']


def _envelope(challenge, cert, signature):
    cert_obj = x509.Certificate.load(cert)
    signed_data = cms.ContentInfo({
        'content_type': 'signed_data',
        'content': cms.SignedData({
            'version': 'v1',
            'digest_algorithms': [
                algos.DigestAlgorithm({
                    'algorithm': 'sha1'
                })
            ],
            'encap_content_info': {
                'content_type': 'data',
                'content': challenge
            },
            'certificates': [cert_obj],
            'signer_infos': [
                cms.SignerInfo({
                    'version': 'v1',
                    'sid': cms.IssuerAndSerialNumber({
                        'issuer': cert_obj['tbs_certificate']['issuer'],
                        'serial_number': cert_obj['tbs_certificate']['serial_number']
                    }),
                    'digest_algorithm': algos.DigestAlgorithm({
                        'algorithm': 'sha1'
                    }),
                    'signature_algorithm': algos.SignedDigestAlgorithm({
                        'algorithm': 'rsassa_pkcs1v15'
                    }),
                    'signature': signature
                })
            ]
        })
    })
    return signed_data.dump()
