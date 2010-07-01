/**
 * fDebug Client Extension
 * 
 * fdebug main class
 * 
 * @author Arne Blankerts <theseer@fcms.de>
 * @copyright 2009-2010 fCMS Development Team
 * @license http://fcms.de/en/site/license.xml freepoint public license
 * @version %version
 * 
 */
var fDebug = {

   observerService : Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService),
   cmsTabBox : null,

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

      if (fDebugSettings.autostart) {
         window.setTimeout(function() {
            fDebug.startService();
         }, 500);
      }
      
      for(var key in fDebugSettings.show) {
         document.getElementById('conf:'+key).checked = fDebugSettings.show[key];
      }
      document.getElementById('conf:popup').checked = fDebugSettings.popup;

   }, // init

   startService : function() {
      document.getElementById('conf:accept').checked = true;
      try {
         this.socket = Components.classes["@mozilla.org/network/server-socket;1"]
               .createInstance(Components.interfaces.nsIServerSocket);
         this.socket.init(fDebugSettings.port, false, 0);
         this.socket.asyncListen(fSocketListener);
         document.getElementById('stateLabel').value = 'Ready...';

         if (fDebugSettings.proxyenable) {
            var proxydata = fDebugSettings.proxyhost + ':' + fDebugSettings.proxyport;
            this.httpObserver = {
               observe : function(subject, topic, data) {
                  subject.QueryInterface(Components.interfaces.nsIHttpChannel);
                  subject.setRequestHeader('X-FDEBUG-PROXY', proxydata, true);
                  subject.setRequestHeader('X-FDEBUG-UUID', fDebugSettings.uuid, true);
               }
            };
            this.observerService.addObserver(this.httpObserver, "http-on-modify-request", false);
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
                  fDebug.logMessage(fDebugSettings.proxyhost, 'Registration with proxy completed.');
               } else {
                  fDebug.logMessage(fDebugSettings.proxyhost, 'Registration with proxy failed.');
               }
            }
         };

         var transportService = Components.classes["@mozilla.org/network/socket-transport-service;1"]
               .getService(Components.interfaces.nsISocketTransportService);
         var transport = transportService.createTransport(null, 0, fDebugSettings.proxyhost, fDebugSettings.proxyport, null);
         transport.setTimeout(transport.TIMEOUT_CONNECT, 10);

         var outstream = transport.openOutputStream(0, 0, 0);

         var message = JSON.stringify( {
            'type' : 'REGISTER',
            'payload' : {
               'UUID' : fDebugSettings.uuid,
               'PORT' : fDebugSettings.port
            }
         }) + "\n";
         outstream.write(message, message.length);

         var stream = transport.openInputStream(0, 0, 0);
         var instream = Components.classes["@mozilla.org/scriptableinputstream;1"]
               .createInstance(Components.interfaces.nsIScriptableInputStream);
         instream.init(stream);

         var dataListener = {
            data : "",
            onStartRequest : function(request, context) {
            },
            onStopRequest : function(request, context, status) {
               instream.close();
               outstream.close();
               listener.finished(this.data, status);
            },
            onDataAvailable : function(request, context, inputStream, offset, count) {
               this.data += instream.read(count);
            }
         };

         var pump = Components.classes["@mozilla.org/network/input-stream-pump;1"]
               .createInstance(Components.interfaces.nsIInputStreamPump);
         pump.init(stream, -1, -1, 0, 0, false);
         pump.asyncRead(dataListener, null);

      } catch (ex) {
         dump(ex);
         this.logMessage(fDebugSettings.proxyhost, 'Registration with proxy failed.');
      }
   },

   processData : function(pool, data) {
      // dump('\n\nRAW: '+data+'\n');
      var session = this.sessionPool[pool];
      try {
         var request = JSON.parse(data);

         switch (request.type) {

            case 'CONTROL': {
               return this.processControl(session, pool, request.payload);
            }

            case 'INTERACTION': {
               return this.processInteraction(session, pool, request.payload);
            }

            case 'MESSAGE':
            case 'VARIABLES':
            case 'SOURCE': {
               if (fDebugSettings.tabs && !session.tab) {
                  // server and uri should have been set first with a CONTROL
                  // request...
                  this.logMessage(session.transport.host, 'Cannot handle out of scope request');
                  return false;
               }
               return this.messageProxy(pool, request);
            }

            default: {
               throw 'Unsupported request type or general object error';
            }

         }

      } catch (ex) {
         this.logMessage(session.transport.host, 'Exception caught:' + ex + ' - Closing connection');
         session.transport.close(0);
         fDebug.inSession--;
         fDebug.sessionPool[pool] = null;
      }
      return true;
   },
   
   processControl: function(session, pool, payload) {
      switch (payload.action) {
         case 'PING': {
            this.logMessage(session.server, 'PING -> PONG');
            dump('PING from Server ' + session.server + '\n');
            break;
         }
         case 'HELO': {
            //dump('HELO from Server ' + payload.server + '\n');
            session.url = payload.url;
            session.server = payload.server;
            if (!fDebugSettings.tabs) {
               if (!this.defaultTab) {
                  this.defaultTab = this.makeTab('chrome://fdebug/content/fdebug/session.xul');
               }
               this.tabPool[session.server] = this.defaultTab;
            } else if (!this.tabPool[session.server]) {
               this.tabPool[session.server] = this.makeTab('chrome://fdebug/content/fdebug/session.xul');
               this.cmsTabBox.selectedTab = this.tabPool[session.server];
            }
            session.tab = this.tabPool[session.server];
            this.cmsTabBox.setTabTitle(session.server, session.tab);
            this.logMessage(payload.server, 'HELO Phase passed');
            break;
         }
         case 'QUIT': {
            this.logMessage(session.server, 'Closing connection');
            dump('QUIT from Server ' + session.server + '\n');
            var sessionWindow = this.cmsTabBox.getBrowserForTab(session.tab);
            if (sessionWindow)
               sessionWindow.contentWindow.fDebugSession.notifyFinish(pool);
            session.transport.close(0);
            fDebug.inSession--;
            fDebug.sessionPool[pool] = null;
            break;
         }
         default: {
            this.logMessage(session.server, 'unkown action (' + payload.action + ')');
            // dump('Unknown action: '+request.payload.action+'\n');
            return false;
         }
      }
      return true;
   },   
   
   processInteraction: function(session, pool, payload) {
      switch (payload.action) {
         case 'CONFIRM': {
            this.logMessage(session.server, 'Processing confirm request');
            this.sessionPool[pool].replyBuffer = confirm(payload.msg) ? 'Y' : 'N';
            break;
         }
         case 'PROMPT': {
            this.logMessage(session.server, 'Processing prompt request');
            this.sessionPool[pool].replyBuffer = prompt(payload.msg);
            break;
         }
         default: {
            this.logMessage(session.server, 'unkown interaction action (' + payload.action + ')');
            // dump('Unknown action: '+request.payload.action+'\n');
            return false;
         }
      }
      return true;
   },

   messageProxy : function(pool, request) {
      try {
         var sessionWindow = this.cmsTabBox.getBrowserForTab(this.sessionPool[pool].tab);
         if (this.sessionPool[pool].msgStack.length > 0) {
            for ( var x in this.sessionPool[pool].msgStack) {

               var rc = sessionWindow.contentWindow.fDebugSession.handleRequest(pool, this.sessionPool[pool].msgStack[x]);
               if (!rc)
                  return false;
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
      this.cmsTabBox.selectedTab = this.cmsTabBox.addTab('chrome://fdebug/content/fdebug/setup.xul', 'Configuration', true);
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
      for ( var i = count; i > 0; i--) {
         if (elements[i].contentDocument.documentElement.getAttribute('windowtype') != 'fcms::static') {
            this.cmsTabBox.removeTab(this.cmsTabBox.tabContainer.childNodes[i]);
         }
      }
   },

   toggleAccept : function() {
      document.getElementById('conf:accept').checked ? this.startService() : this.stopService();
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
      cell.setAttribute('label', d.toLocaleDateString() + ' ' + h.substr(h.length - 2, 2) + ':' + m.substr(m.length - 2, 2) + '.'
            + s.substr(s.length - 2, 2));
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
   }

};
