#!/bin/bash
make_release() {
  rm Release Release.gpg InRelease
  apt-ftparchive release . > /tmp/Release
  cp /tmp/Release Release
  gpg --clearsign -o InRelease Release
  gpg -abs -o Release.gpg Release
}

for packagedir in dists/bionic/unofficial/binary-*
do
  pushd "$packagedir"
  apt-ftparchive packages . | tee Packages | gzip > Packages.gz
  make_release
  popd
done

pushd dists/bionic/unofficial/source
apt-ftparchive sources . | tee Sources | gzip > Sources.gz
make_release
popd

pushd dists/bionic
make_release
popd
