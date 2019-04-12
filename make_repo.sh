#!/bin/bash
pushd dists/bionic

make_release() {
  rm "$1/Release" "$1/Release.gpg" "$1/InRelease"
  apt-ftparchive release "$1" > /tmp/Release
  cp /tmp/Release "$1/Release"
  gpg --clearsign -o "$1/InRelease" "$1/Release"
  gpg -abs -o "$1/Release.gpg" "$1/Release"
}

for packagedir in unofficial/binary-*
do
  apt-ftparchive packages "$packagedir" | tee "$packagedir/Packages" | gzip > "$packagedir/Packages.gz"
  make_release "$packagedir"
done

apt-ftparchive sources unofficial/source | tee unofficial/source/Sources | gzip > unofficial/source/Sources.gz
make_release unofficial/source

make_release .
popd
