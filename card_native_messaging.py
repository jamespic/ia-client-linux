#!/usr/bin/env python3
import base64
import json
import PyKCS11
import struct
import sys
import traceback

from pyasn1.type import univ, tag
from pyasn1.codec.ber import encoder, decoder


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
            return base64.b64encode(
                _envelope(challenge_bin, self._cert, signature)
            ).decode('ascii')

    def logout(self):
        self._session.logout()
        self._session.closeSession()


def _get_uid_from_subject(asn1):
    return decoder.decode(asn1)[0][2][0][1]._value.decode('utf-8')


def _envelope(challenge, cert, signature):
    user_certificate = decoder.decode(cert)

    version_section = univ.Integer(1)

    digest_section = univ.Set()
    digest_section[0] = univ.Sequence()
    digest_section[0][0] = univ.ObjectIdentifier('1.3.14.3.2.26')
    digest_section[0][1] = univ.Null()

    challenge_section = univ.Sequence()
    challenge_section[0] = univ.ObjectIdentifier('1.2.840.113549.1.7.1')
    challenge_section[1] = univ.OctetString(
        value=base64.b64decode(challenge),
        tagSet=tag.TagSet((), tag.Tag(0, 0, 4), tag.Tag(128, 32, 0))
    )

    cert_section = univ.Sequence(
        tagSet=tag.TagSet((), tag.Tag(0, 32, 16), tag.Tag(128, 32, 0)))
    cert_section[0] = user_certificate[0][0]
    cert_section[1] = user_certificate[0][1]
    cert_section[2] = user_certificate[0][2]

    response_section = univ.Set()
    response_section[0] = univ.Sequence()
    response_section[0][0] = univ.Integer(1)
    response_section[0][1] = univ.Sequence()
    response_section[0][1][0] = user_certificate[0][0][3]
    response_section[0][1][1] = user_certificate[0][0][1]
    response_section[0][2] = univ.Sequence()
    response_section[0][2][0] = univ.ObjectIdentifier('1.3.14.3.2.26')
    response_section[0][2][1] = univ.Null()
    response_section[0][3] = univ.Sequence()
    response_section[0][3][0] = univ.ObjectIdentifier('1.2.840.113549.1.1.1')
    response_section[0][3][1] = univ.Null()
    response_section[0][4] = univ.OctetString(signature)

    outer = univ.Sequence()
    outer[0] = univ.ObjectIdentifier('1.2.840.113549.1.7.2')
    outer[1] = univ.Sequence(
        tagSet=tag.TagSet((), tag.Tag(0, 32, 16), tag.Tag(128, 32, 0)))
    outer[1][0] = version_section
    outer[1][1] = digest_section
    outer[1][2] = challenge_section
    outer[1][3] = cert_section
    outer[1][4] = response_section

    return encoder.encode(outer)


def read_chrome_data(stream):
    data_len_raw = stream.read(4)
    if len(data_len_raw) != 4:
        return None
    data_len = struct.unpack('@I', data_len_raw)[0]
    data = stream.read(data_len)
    if len(data) < data_len:
        return None
    return json.loads(data.decode('utf-8'))


def write_chrome_data(stream, data):
    encoded = json.dumps(data).encode('utf-8')
    stream.write(struct.pack('@I', len(encoded)))
    stream.write(encoded)
    stream.flush()


def run_messaging_protocol(app):
    while True:
        req = read_chrome_data(sys.stdin.buffer)
        if req is None:
            return
        try:
            method_name = req['method']
            if method_name.startswith('_'):
                raise AttributeError('Method {} not found'.format(method_name))
            method = getattr(app, method_name)
            if isinstance(req['params'], list):
                result = method(*req['params'])
            else:
                result = method(**req['params'])
            if 'id' in req:
                write_chrome_data(sys.stdout.buffer, {
                    'id': req['id'],
                    'error': None,
                    'result': result
                })
        except Exception as e:
            if 'id' in req:
                write_chrome_data(sys.stdout.buffer, {
                    'id': req['id'],
                    'error': str(e),
                    'result': None
                })
            traceback.print_exc(file=sys.stderr)


if __name__ == '__main__':
    run_messaging_protocol(SmartcardAuth())
