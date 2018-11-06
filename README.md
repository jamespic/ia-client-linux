Identity Agent Chrome Extension for Linux
=========================================

This is intended to be an implementation of an authentication extension for
Chrome, compatible with NHS Digital's Identity Agent.

Requirements (mostly a reminder to me - I'll stick it in a deb eventually)
--------------------------------------------------------------------------

We use some packages from the NHoS repos:

```
curl -s https://packagecloud.io/install/repositories/nhsbuntu/nhs-smartcards/script.deb.sh | sudo bash
sudo apt install python3-dev pcscd libclassicclient libssl0.9.8 ifdokccid python3-pykcs11 python3-pyscard python3-asn1crypto # The last of these is not packaged for Xenial yet
```
