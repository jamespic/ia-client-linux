#!/bin/bash
make_release() {
  rm Release Release.gpg
  apt-ftparchive release . > /tmp/Release
  cp /tmp/Release Release
  gpg -s Release
}

for packagedir in dists/bionic/unofficial/binary-*
do
  pushd "$packagedir"
  apt-ftparchive packages . | gzip > Packages.gz
  make_release
  popd
done

pushd dists/bionic/unofficial/source
apt-ftparchive sources . | gzip > Sources.gz
make_release
popd

make_release
