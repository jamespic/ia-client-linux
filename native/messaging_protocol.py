import json
import struct
import sys
import traceback


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
