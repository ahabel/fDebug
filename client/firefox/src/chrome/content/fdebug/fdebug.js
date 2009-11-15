
/**
 * fDebug Client Extension
 * 
 * fdebug main class
 * 
 * @author Arne Blankerts <theseer@fcms.de>
 * @copyright 2009 fCMS Development Team
 * @license http://fcms.de/en/site/license.xml freepoint public license
 * @version SVN: $Revision$
 * 
 */
var fDebug = {

   observerService : Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService),
   cmsTabBox : null,

   settings : {},
   socket : null,

   inSession : 0,
   poolCount : 0,
   sessionPool : [],
   tabPool : [],

   observerBound : false,
   httpObserver : null,

   historyFrame : null,
   history : null,

   defaultTab : null,

   init : function() {

      this.cmsTabBox = document.getElementById('main');
      this.cmsTabBox.setTabTitle('fDebug MessageLog');
      this.loadSettings();

      if (this.settings['autostart']) {
         window.setTimeout(function() {
                  fDebug.startService();
               }, 500);
      }

   }, // init

   loadSettings : function() {

      // dump('loadSettings\n');

      this.settings['contextlist'] = fPreference.getValue('fdebug.context.list', 'fCore').split(' ');
      dump('ContextList: ' + this.settings['contextlist'].length + ' -> '+ this.settings['contextlist'][0]);
      this.settings['color'] = {};
      if (this.settings['contextlist'].length > 0) {
         for (var x = 0; x < this.settings['contextlist'].length; x++) {
            var t = this.settings['contextlist'][x];
            this.settings['color'][t] = fPreference.getValue("fdebug.color." + t, '#ccc');
         }
      }

      this.settings['uuid'] = fPreference.getValue('fdebug.uuid', '');
      if (this.settings['uuid'] == '') {
         var uuidGenerator = Components.classes["@mozilla.org/uuid-generator;1"].getService(Components.interfaces.nsIUUIDGenerator);
         this.settings['uuid'] = uuidGenerator.generateUUID().toString();
         fPreference.setValue('fdebug.uuid', this.settings['uuid'], 'STRING');
      }

      this.settings['contextshow']  = fPreference.getValue("fdebug.context.show", false);
      this.settings['contextlearn'] = fPreference.getValue("fdebug.context.learn", false);

      // general connection settings
      this.settings['port']      = fPreference.getValue("fdebug.port", 5005);
      this.settings['autostart'] = fPreference.getValue("fdebug.autostart",
            false
      );
      this.settings['silent']  = fPreference.getValue("fdebug.silent", false);
      this.settings['tabs']    = fPreference.getValue("fdebug.tabs", true);
      this.settings['multi']   = fPreference.getValue("fdebug.multi", true);
      this.settings['details'] = fPreference.getValue("fdebug.details", false);

      this.settings['history'] = fPreference.getValue("fdebug.history", 15);

      this.settings['proxyenable'] = fPreference.getValue("fdebug.proxy.enable", false);
      this.settings['proxyhost']   = fPreference.getValue("fdebug.proxy.host", '');
      this.settings['proxyport']   = fPreference.getValue("fdebug.proxy.port", '5005');

      this.settings['expireenable'] = fPreference.getValue("fdebug.expire.enable", false);
      this.settings['expireremove'] = fPreference.getValue("fdebug.expire.remove", false);
      this.settings['expirelimit']  = fPreference.getValue("fdebug.expire.limit", '50');

      // whitelist & blacklist
      this.settings['whitelist'] = fPreference.getValue('fdebug.whitelist', '127.0.0.1').split(' ').sort();
      this.settings['blacklist'] = fPreference.getValue('fdebug.blacklist', '').split(' ').sort();

      // Display settings
      if (!fPreference.getValue('fdebug.show.message', true))
         document.getElementById('conf:message').removeAttribute('checked');
      
      if (!fPreference.getValue('fdebug.show.warning', true))
         document.getElementById('conf:warning').removeAttribute('checked');
      
      if (!fPreference.getValue('fdebug.show.error', true))
         document.getElementById('conf:error').removeAttribute('checked');
      
      if (!fPreference.getValue('fdebug.show.fatal', true))
         document.getElementById('conf:fatal').removeAttribute('checked');

      if (!fPreference.getValue('fdebug.display.popup', true))
         document.getElementById('conf:popup').removeAttribute('checked');

   },

   startService : function() {
      document.getElementById('conf:accept').checked = true;

      var socketListener = {

         onSocketAccepted : function(serv, transport) {

            // blacklist check
            if (fDebug.settings['blacklist'].indexOf(transport.host) != -1) {
               fDebug.logMessage(transport.host, 'Host blacklisted');
               // dump('BLACKLIST HIT: '+transport.host+'\n');
               // addItem('Control','Connection from Host "'+transport.host+'"
               // not allowed - disconnect');
               transport.close(0);
               return;
            }

            if (fDebug.settings['whitelist'].indexOf(transport.host) == -1) {
               // host not yet allowed - handle
               if (fDebug.settings['silent']) {
                  fDebug.logMessage(transport.host,'Host not allowed - dropping connection');
                  transport.close(0);
                  return;
               }

               var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);

               var check = {
                  value : false
               };
               var flags = prompts.STD_YES_NO_BUTTONS;

               var result = prompts.confirmCheck(window,
                     'fDebug Connection request', "Accept connection from IP '" + transport.host + "' ?",
                     'Save decision in whitelist/blacklist', 
                     check
               );

               if (check.value) { // save option marked
                  var key = (result ? 'whitelist' : 'blacklist');
                  fDebug.settings[key].push(transport.host);
                  fPreference.setValue('fdebug.' + key, fDebug.settings[key].join(' '), 'STRING');
               }

               if (!result) { // request refused - leave
                  transport.close(0);
                  return;
               }
            }

            // multiconnections?
            if (fDebug.inSession > 0 && !fDebug.settings['multi']) {
               fDebug.logMessage(transport.host, 'Too many connections - blocking');
               // dump('InSession block!\n');
               transport.close(0);
               return;
            }

            fDebug.inSession++;
            var pool = ++fDebug.poolCount;
            fDebug.sessionPool[pool] = {
               transport : transport,
               server : '',
               url : '',
               tab : '',
               msgStack : []
            };

            fDebug.logMessage(transport.host, 'Host connected');
            // dump('CONNECTION: '+transport.host+'\n');

            try {

               var stream = transport.openInputStream(0, 0, 0);
               var outstream = transport.openOutputStream(0, 0, 0);
               var instream = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance(Components.interfaces.nsIScriptableInputStream);
               instream.init(stream);

               var dataListener = {

                  pool : pool,
                  buffer : '',

                  onStartRequest : function(request, context) {
                  },

                  onStopRequest : function(request, context, status) {
                     instream.close();
                     outstream.close();
                     fDebug.inSession--;
                     fDebug.sessionPool[this.pool] = null;
                  },

                  onDataAvailable : function(request, context, inputStream, offset, count) {
                     var x = instream.read(count);
                     this.buffer = this.buffer + x;
                     // dump('X:'+x+'\n');
                     // dump('Buffer: ['+this.buffer+']\n');

                     if (this.buffer.indexOf('\n') != -1) {
                        var tmp = this.buffer.split('\n');
                        this.buffer = tmp[1];
                        outstream.write('OK\n', 3);
                        if (!fDebug.processData(this.pool, tmp[0])) {
                           fDebug.logMessage(transport.host, 'Error processing payload.');
                           fCore.debug('Processing fDebug data failed:' + tmp[0]);
                        }
                     }
                  }
               };

               var pump = Components.classes["@mozilla.org/network/input-stream-pump;1"].createInstance(Components.interfaces.nsIInputStreamPump);
               pump.init(stream, -1, -1, 0, 0, false);
               pump.asyncRead(dataListener, null);

            } catch (ex) {
               fDebug.logMessage('', 'Accept error');
               document.getElementById('stateLabel').value = 'Accept error';
               // dump("::"+ex);
            }
         },
         
         onStopListening : function(serv, status) {
         }
      };

      try {
         this.socket = Components.classes["@mozilla.org/network/server-socket;1"].createInstance(Components.interfaces.nsIServerSocket);
         this.socket.init(this.settings['port'], false, 0);
         this.socket.asyncListen(socketListener);
         document.getElementById('stateLabel').value = 'Ready...';

         if (this.settings['proxyenable']) {
            dump('proxy enabled\n');
            var proxydata = this.settings['proxyhost'] + ':' + this.settings['proxyport'];
            this.httpObserver = {
               observe : function(subject, topic, data) {
                  subject.QueryInterface(Components.interfaces.nsIHttpChannel);
                  subject.setRequestHeader('X-FDEBUG-PROXY', proxydata, true);
                  subject.setRequestHeader('X-FDEBUG-UUID', fDebug.settings['uuid'], true );
               }
            };
            this.observerService.addObserver(this.httpObserver, "http-on-modify-request", false );
            this.observerBound = true;
            this.registerWithProxy();
         }
         this.logMessage('', 'Service started');

      } catch (ex) {
         document.getElementById('stateLabel').value = 'Bind error';
         this.logMessage('', 'Could not bind to port');
         // dump(ex);
      }

   },

   stopService : function() {
      if (this.socket)
         this.socket.close();

      if (this.observerBound) {
         this.observerService.removeObserver(this.httpObserver, "http-on-modify-request");
         this.observerBound = false;
      }

      document.getElementById('stateLabel').value = 'Service stopped';
      this.logMessage('', 'Service stopped');
      this.socket = false;
   },

   registerWithProxy : function() {
      try {
         var listener = {
            finished : function(data, status) {
               dump('\nStatus: ' + status + '\nData:' + data + '\n');
               if (status == 0) {
                  fDebug.logMessage(fDebug.settings['proxyhost'], 'Registration with proxy completed.');
               } else {
                  fDebug.logMessage(fDebug.settings['proxyhost'],'Registration with proxy failed.');
               }
            }
         };

         var transportService = Components.classes["@mozilla.org/network/socket-transport-service;1"].getService(Components.interfaces.nsISocketTransportService);
         var transport = transportService.createTransport(null, 0,this.settings['proxyhost'], this.settings['proxyport'], null);
         transport.setTimeout(transport.TIMEOUT_CONNECT, 10);

         var outstream = transport.openOutputStream(0, 0, 0);

         var message = JSON.stringify({
                  'type' : 'REGISTER',
                  'payload' : {
                     'UUID' : this.settings['uuid'],
                     'PORT' : this.settings['port']
                  }
               }) + "\n";
         outstream.write(message, message.length);

         var stream = transport.openInputStream(0, 0, 0);
         var instream = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance(Components.interfaces.nsIScriptableInputStream);
         instream.init(stream);

         var dataListener = {
            data : "",
            onStartRequest : function(request, context) {},
            onStopRequest : function(request, context, status) {
               instream.close();
               outstream.close();
               listener.finished(this.data, status);
            },
            onDataAvailable : function(request, context, inputStream, offset, count) {
               this.data += instream.read(count);
            }
         };

         var pump = Components.classes["@mozilla.org/network/input-stream-pump;1"].createInstance(Components.interfaces.nsIInputStreamPump);
         pump.init(stream, -1, -1, 0, 0, false);
         pump.asyncRead(dataListener, null);

      } catch (ex) {
         dump(ex);
         this.logMessage(this.settings['proxyhost'], 'Registration with proxy failed.');
      }
   },

   processData : function(pool, data) {
      // dump('\n\nRAW: '+data+'\n');
      try {
         var session = this.sessionPool[pool];
         var request = JSON.parse(data);

         if (request.type == 'CONTROL') {
            switch (request.payload.action) {
               case 'PING' : {
                  this.logMessage(session.server, 'PING -> PONG');
                  dump('PING from Server ' + session.server + '\n');
                  break;
               }
               case 'HELO' : {
                  dump('HELO from Server ' + request.payload.server + '\n');
                  session.url = request.payload.url;
                  session.server = request.payload.server;
                  if (!this.settings['tabs']) {
                     if (!this.defaultTab) {
                        this.defaultTab = this.makeTab('chrome://fcms-core/content/fdebug2/session.xul');
                     }
                     this.tabPool[session.server] = this.defaultTab;
                  } else if (!this.tabPool[session.server]) {
                     this.tabPool[session.server] = this.makeTab('chrome://fcms-core/content/fdebug2/session.xul');
                     this.cmsTabBox.selectedTab = this.tabPool[session.server];
                  }
                  session.tab = this.tabPool[session.server];
                  this.cmsTabBox.setTabTitle(session.server, session.tab);
                  this.logMessage(request.payload.server, 'HELO Phase passed');
                  break;
               }
               case 'QUIT' : {
                  this.logMessage(session.server, 'Closing connection');
                  dump('QUIT from Server ' + session.server + '\n');
                  var sessionWindow = this.cmsTabBox.getBrowserForTab(session.tab);
                  sessionWindow.contentWindow.fDebugSession.notifyFinish(pool);
                  session.transport.close(0);
                  fDebug.inSession--;
                  fDebug.sessionPool[pool] = null;
                  break;
               }
               default : {
                  this.logMessage(session.server, 'unkown action (' + request.payload.action + ')');
                  // dump('Unknown action: '+request.payload.action+'\n');
                  return false;
               }
            }
            return true;
         }
         if (this.settings['tabs'] && !session.tab) {
            // server and uri should have been set first with a CONTROL
            // request...
            return false;
         }

         // send data to tab
         return this.messageProxy(pool, request);

      } catch (ex) {
         // oldstyle?
         this.logMessage(session.transport.host, 'Oudated protocol - use compat mode or update backend!');
         session.transport.close(0);
         fDebug.inSession--;
         fDebug.sessionPool[pool] = null;
         // dump('UNSUPPORTED OLD STYLE?!\n'+ex+'\n');
      }
      return true;
   },

   messageProxy : function(pool, request) {
      try {
         var sessionWindow = this.cmsTabBox.getBrowserForTab(this.sessionPool[pool].tab);
         if (this.sessionPool[pool].msgStack.length > 0) {
            for (var x in this.sessionPool[pool].msgStack) {

               var rc = sessionWindow.contentWindow.fDebugSession.handleRequest(pool, this.sessionPool[pool].msgStack[x]);
               if (!rc) return false;
            }
            this.sessionPool[pool].msgStack = [];
         }
         return sessionWindow.contentWindow.fDebugSession.handleRequest(pool, request);
      } catch (ex) {
         // looks like the panel is not yet ready, stack message
         this.sessionPool[pool].msgStack.push(request);
         return true;
      }
   },

   notifyClose : function(server) {
      this.tabPool[server] = null;
      if (this.tabPool.length == 0) {
         this.defaultTab = null;
      }
   },

   openSetup : function() {
      this.cmsTabBox.selectedTab = this.cmsTabBox.addTab('chrome://fcms-core/content/fdebug2/setup.xul', 'Configuration', true);
   },

   initTab : function(event) {
      if (this.cmsTabBox) {
         var iframe = this.cmsTabBox.getBrowserForEvent(event);
         if (!iframe.contentWindow.fDebugSession) {
            this.cmsTabBox.getTabForBrowser(iframe).setAttribute('label', iframe.contentDocument.title);
         }
      }
   },

   switchTo : function(uri) {
      // dump('SwitchTo: '+uri+'\n');
      this.cmsTabBox.selectedTab = this.cmsTabBox.addTab(uri, 'Loading...', false);
   },

   makeTab : function(uri) {
      // dump('makeTab: '+uri+'\n');
      return this.cmsTabBox.addTab(uri, 'Loading...', false);
   },

   shutdown : function() {
      if (this.socket)
         this.stopService();
      // this.sessionPool.forEach(function(x){x.transport.close(0);});
   },

   clearAll : function() {
      var elements = this.cmsTabBox.panelContainer.childNodes;
      var count = elements.length - 1;
      for (var i = count; i > 0; i--) {
         if (elements[i].contentDocument.documentElement.getAttribute('windowtype') != 'fcms::static') {
            this.cmsTabBox.removeTab(this.cmsTabBox.tabContainer.childNodes[i]);
         }
      }
   },

   toggleAccept : function() {
      document.getElementById('conf:accept').checked
            ? this.startService()
            : this.stopService();
   },

   logMessage : function(ip, msg) {
      if (!this.history) {
         dump('Ooups - no history object\nMsg:' + msg + ' (IP:' + ip + ')\n');
         return;
      }
      var item = document.createElementNS(XULNS, 'listitem');
      var cell = document.createElementNS(XULNS, 'listcell');
      var d = new Date();
      var h = '0' + d.getHours();
      var m = '0' + d.getMinutes();
      var s = '0' + d.getSeconds();
      cell.setAttribute('style', 'padding-right:4px;');
      cell.setAttribute('label', d.toLocaleDateString() + ' '
                  + h.substr(h.length - 2, 2) + ':' + m.substr(m.length - 2, 2)
                  + '.' + s.substr(s.length - 2, 2));
      item.appendChild(cell);

      var cell = document.createElementNS(XULNS, 'listcell');
      cell.setAttribute('style', 'padding-right:4px;');
      cell.setAttribute('label', ip);
      item.appendChild(cell);

      var cell = document.createElementNS(XULNS, 'listcell');
      cell.setAttribute('label', msg);
      item.appendChild(cell);

      this.history.appendChild(item);
      this.history.ensureElementIsVisible(item);
   },

   compatMode : function() {
      this.shutdown();
      this.clearAll();
      this.logMessage('', 'Starting compat mode');
      document.getElementById('compatFrame').setAttribute('src', 'chrome://fcms-core/content/fdebug/fdebug.xul');
      document.getElementById('coreBox').selectedIndex = 1;
   },

   normalMode : function() {

      this.logMessage('', 'Returning to normal mode');
      document.getElementById('compatFrame').contentWindow.stop();
      document.getElementById('coreBox').selectedIndex = 0;

      var me = this;
      setTimeout(function() {
               document.getElementById('compatFrame').src = 'about:blank';
               if (me.settings['autostart'])
                  me.startService();
            }, 500);
   }

};
