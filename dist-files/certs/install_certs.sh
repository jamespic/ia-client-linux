#!/bin/sh
certutil -d sql:$HOME/.pki/nssdb -A -t "C,," -n 'NHS Root' -i nhs-root.crt
certutil -d sql:$HOME/.pki/nssdb -A -t "C,," -n 'NHS NIS1' -i nhs-test-nis1-root.crt
certutil -d sql:$HOME/.pki/nssdb -A -t "C,," -n 'NHS NIS3' -i nhs-test-nis3-root.crt
certutil -d sql:$HOME/.pki/nssdb -A -t "C,," -n 'NHS NIS4 Root' -i nhs-test-nis4-root.crt
certutil -d sql:$HOME/.pki/nssdb -A -t "C,," -n 'NHS Spine Test' -i nhs-test-spine-root.crt
