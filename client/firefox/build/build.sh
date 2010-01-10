#!/bin/sh
echo 
echo "fDebug XPI Builder"
echo
latest=`cat ./latest`
echo -n "Enter version (latest: $latest): "
read VERSION
if [ -z "$VERSION" ]; then
    VERSION=$latest
fi
rm -f fdebug.xpi install.rdf chrome/fdebug.jar 2>&1 >/dev/null
sed "s/%version/$VERSION/" install.rdf.tpl > install.rdf

cd ../src/chrome
zip -r ../../build/chrome/fdebug.jar content locale

cd ../../build
zip -r fdebug.xpi chrome.manifest install.rdf chrome

echo "Build complete."
