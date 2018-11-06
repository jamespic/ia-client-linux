#!/usr/bin/env python3
import argparse
import sys
from card_native_messaging import SmartcardAuth

if __name__ == '__main__':
    arg_parser = argparse.ArgumentParser(description="Sign a challenge with a smartcard")
    arg_parser.add_argument('challenge_base64', help="The data to sign, in base64")
    args = arg_parser.parse_args()

    auth = SmartcardAuth()
    print('Please enter your PIN:', file=sys.stderr)
    pin = sys.stdin.readline().strip()
    auth.login(pin)
    print(auth.sign(args.challenge_base64))
    auth.logout()
