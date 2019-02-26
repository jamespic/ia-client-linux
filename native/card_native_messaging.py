#!/usr/bin/env python3
from messaging_protocol import run_messaging_protocol
from smartcard_auth import SmartcardAuth
from auth_facade import AuthFacade


if __name__ == '__main__':
    run_messaging_protocol(AuthFacade(SmartcardAuth()))
