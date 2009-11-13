#!/bin/sh

tar -czf /root/rpmbuild/SOURCES/fdebug.tar.gz ../../fdebug/
rpmbuild -bb fdebug.spec

echo ""
echo "Done.."
