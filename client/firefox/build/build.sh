#!/bin/sh
echo 
echo "fDebug XPI Builder"
echo
latest=`cat ./latest`
echo -n "Enter version (latest: $latest): "
read VERSION
if [ -z "$VERSION" ]; then
    VERSION=$latest
    echo $latest >./latest
fi
rm -rf fdebug.xpi install.rdf content locale 2>&1 >/dev/null
sed "s/%version/$VERSION/" install.rdf.tmpl > install.rdf

cd ../src/chrome
cp -r content locale ../../build

cd ../../build
zip -r fdebug.xpi chrome.manifest install.rdf content locale

echo "Build complete."
