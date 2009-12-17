#!/bin/sh

if [ `whoami` != "root" ]; then
   echo "Please run this script as root user";
   exit 0;
fi;

tar -czf /root/rpmbuild/SOURCES/fdebug.tar.gz ../../fdebug/
rpmbuild -bb fdebug.spec

echo ""
echo "Done.."
