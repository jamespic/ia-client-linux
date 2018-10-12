#!/usr/bin/env python3
from card_native_messaging import run_messaging_protocol
import sys


class Pinger:
    def ping(self, message='pong'):
        print(message, file=sys.stderr)
        return message


if __name__ == '__main__':
    run_messaging_protocol(Pinger())
