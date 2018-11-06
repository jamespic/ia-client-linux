#!/usr/bin/env python3
from unittest import TestCase, main, skip

import io
import os
import subprocess
from card_native_messaging import read_chrome_data, write_chrome_data


class RemoteException(Exception):
    pass


class Client:
    def __init__(self, command, shell=False):
        self.process = subprocess.Popen(
            command,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            shell=shell
        )
        self.i = 0

    def __getattr__(self, method_name):
        def method(*args, **kwargs):
            i = self.i
            self.i += 1
            if kwargs:
                params = kwargs
            else:
                params = args
            write_chrome_data(self.process.stdin, {
                'id': i,
                'method': method_name,
                'params': params,
                'jsonrpc': '2.0'
            })
            result = read_chrome_data(self.process.stdout)
            if result['error']:
                raise RemoteException(result['error'])
            else:
                return result['result']
        return method

    def close(self):
        self.process.kill()

    __del__ = close


class CardMessagingTest(TestCase):
    def test_read_write_messages(self):
        with io.BytesIO() as buff:
            data = {'a': 1}
            write_chrome_data(buff, {'a': 1})
            buff.seek(0)
            result = read_chrome_data(buff)
            self.assertEqual(result, data)

    def test_messaging(self):
        proc_name = os.path.abspath('./pinger.py')
        client = Client([proc_name])

        try:
            print(client.ping())
            self.assertEqual(client.ping(), 'pong')
            self.assertEqual(client.ping('pung'), 'pung')
            self.assertEqual(client.ping(message='peng'), 'peng')
            with self.assertRaises(RemoteException):
                client.pung()
        finally:
            client.close()

if __name__ == '__main__':
    main()
