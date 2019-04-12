#!/bin/bash
basedir=dists/bionic/unofficial
make_release() {
  rm "$1/Release" "$1/Release.gpg" "$1/InRelease"
  apt-ftparchive release "$1" > /tmp/Release
  cp /tmp/Release "$1/Release"
  gpg --clearsign -o "$1/InRelease" "$1/Release"
  gpg -abs -o "$1/Release.gpg" "$1/Release"
}

for packagedir in $basedir/binary-*
do
  apt-ftparchive packages "$packagedir" | tee "$packagedir/Packages" | gzip > "$packagedir/Packages.gz"
  #make_release "$packagedir"
done

apt-ftparchive sources "$basedir/source" | tee "$basedir/source/Sources" | gzip > "$basedir/source/Sources.gz"
#make_release "$basedir/source"

make_release .
