
/**
 * fDebug Client Extension
 * 
 * fSocketListener class
 * 
 * @author Arne Blankerts <theseer@fcms.de>
 * @copyright 2009-2010 fCMS Development Team
 * @license http://fcms.de/en/site/license.xml freepoint public license
 * @version %version
 * 
 */
var fSocketListener = {
      
   onSocketAccepted : function(serv, transport) {

      // blacklist check
      if (fDebugSettings.blacklist.indexOf(transport.host) != -1) {
         fDebug.logMessage(transport.host, 'Host blacklisted');
         transport.close(0);
         return;
      }

      if (fDebugSettings.whitelist.indexOf(transport.host) == -1) {
         // host not yet allowed - handle
         if (fDebugSettings.silent) {
            fDebug.logMessage(transport.host, 'Host not allowed - dropping connection');
            transport.close(0);
            return;
         }

         var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
               .getService(Components.interfaces.nsIPromptService);

         var check = {
            value : false
         };

         var result = prompts.confirmCheck(window, 'fDebug Connection request', "Accept connection from IP '"
               + transport.host + "' ?", 'Save decision in whitelist/blacklist', check);

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
      if (fDebug.inSession > 0 && !fDebugSettings.multi) {
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
         msgStack : [],
         replyBuffer : null
      };

      fDebug.logMessage(transport.host, 'Host connected');
      // dump('CONNECTION: '+transport.host+'\n');

      try {

         var stream = transport.openInputStream(0, 0, 0);
         var outstream = transport.openOutputStream(0, 0, 0);
         var instream = Components.classes["@mozilla.org/scriptableinputstream;1"]
               .createInstance(Components.interfaces.nsIScriptableInputStream);
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
               if (this.buffer.indexOf('\n') != -1) {
                  var tmp = this.buffer.split('\n');
                  this.buffer = tmp[1];
                  var rc = fDebug.processData(this.pool, tmp[0]);
                  if (!rc) {
                     fDebug.logMessage(transport.host, 'Error processing payload.');
                     fCore.debug('Processing fDebug data failed:' + tmp[0]);
                     outstream.write('ERROR\n', 6);
                     return;
                  }
                  if (fDebug.sessionPool[this.pool] && fDebug.sessionPool[this.pool].replyBuffer) {
                     outstream.write(fDebug.sessionPool[this.pool].replyBuffer + '\n',
                           fDebug.sessionPool[this.pool].replyBuffer.length + 1);
                     fDebug.sessionPool[this.pool].replyBuffer = null;
                  } else {
                     outstream.write('OK\n', 3);
                  }
               }
            }
         };

         var pump = Components.classes["@mozilla.org/network/input-stream-pump;1"]
               .createInstance(Components.interfaces.nsIInputStreamPump);
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
