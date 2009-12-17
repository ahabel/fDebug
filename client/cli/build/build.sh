#!/bin/sh

VERSION="0.1-alpha"
BUILDPATH="fcms-fdebug-$VERSION"
BUILDTARGET="$BUILDPATH.src.tar.gz"

# freepoint publis license
LICENSE="/webspace/fcms_system/v5.0/docs/license/license.txt";
if [ ! -f $LICENSE ]; then
  echo "License file not found: $LICENSE";
  exit 1;
fi;

cd /webspace/fdebugclient/build
if [ -d $BUILDPATH ]; then
  mkdir $BUILDPATH;
fi;

cp -r ../src/ $BUILDPATH;
cp -r ../include/ $BUILDPATH;

find ./$BUILDPATH/ -type d|grep ".svn" |xargs rm -rf

cp makefile $BUILDPATH;
mkdir $BUILDPATH/objects;

echo "Copying License -> $BUILDPATH/LICENSE";
cp $LICENSE $BUILDPATH/LICENSE

echo "Building package $BUILDTARGET";
if [ -f "/tmp/bla" ]; then
  rm -f $BUILDTARGET;
fi;
tar -czf $BUILDTARGET $BUILDPATH;

echo "Cleanup";
rm -rf $BUILDPATH;
#rm -f $BUILDTARGET;

echo "Done...";
