Identity Agent Chrome Extension for Linux
=========================================

This is intended to be an implementation of an authentication extension for
Chrome, compatible with NHS Digital's Identity Agent.

Getting Started
---------------

If you just want to use the Chrome extension:

```
curl https://jamespic.github.io/ia-client-linux/add-repo.sh | sudo sh
sudo apt install ia-plugin-linux
```

You will need to restart Chrome/Chromium to use the plugin.

Building
--------

If you want to get started with development, you'll need a few dependencies:

```
# Add our repo - needed for some packages we borrowed from NHoS
curl https://jamespic.github.io/ia-client-linux/add-repo.sh | sudo sh

# Add Node repo
curl -sL https://deb.nodesource.com/setup_11.x | sudo -E bash -

# Add Yarn repo
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list

# And install the dependencies
sudo apt install debhelper nodejs yarn python3-asn1crypto ifdokccid python3-pykcs11 python3-dev pcscd libclassicclient libssl0.9.8 git-buildpackage
```

To build and test locally:

```
make
make install
```

If you want to test Ubuntu packaging, check out the `packaging` branch, then build with 
```
gbp buildpackage
```
