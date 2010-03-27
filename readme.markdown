fDebug
======

To make use of fDebug a client as well as a server part needs to be used. While logically a client,
the fdebug client app or extension is technically the server - waiting for debug information to arrive.

You can download a prebuild XPI from http://fdebug.de or http://addons.mozilla.org.

XPI Building
------------

Within the repository you can find a small shellscript to build an XPI. Simply change to the client directory
and run it:

    cd client/firefox/build
    ./build.sh

You will be asked for a version number for your XPI build. Please do not use any "offical" release version strings
here when doing custom build to avoid confusion for other users in case you plan on shipping your (modified) XPI.


Usage examples
--------------

PHP version of the server code:

    <?php

    require 'fdebug.lib.php';

    $fdebug = fDebug::getInstance();
    $fdebug->setSession('localhost','example Request');
    $fdebug->openSocket('127.0.0.1');

    $fdebug->sendMessage("test\ntest\n\test!");
    $fdebug->sendWarning('test');
    $fdebug->sendVariables(array('Foo' => 'bar'), false);

    $fdebug->sendSource('<?xml version="1.0" ?><root><foo/></root>');

