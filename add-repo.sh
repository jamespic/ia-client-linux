#!/bin/sh
curl https://jamespic.github.io/ia-client-linux/key.gpg | sudo apt-key add -
curl https://jamespic.github.io/ia-client-linux/ia-client-linux.list | sudo tee /etc/apt/sources.list.d/ia-client-linux.list
sudo apt update

