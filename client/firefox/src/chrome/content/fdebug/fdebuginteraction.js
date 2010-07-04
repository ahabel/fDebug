/**
 * fDebug Client Extension
 * 
 * fdebugInteraction class
 * 
 * @author Arne Blankerts <theseer@fcms.de>
 * @copyright 2009-2010 fCMS Development Team
 * @license http://fcms.de/en/site/license.xml freepoint public license
 * @version %version
 * 
 */
var fDebugInteraction = {

   process: function(session, pool, payload) {
      if (!fDebugSettings.interaction) {
         if (payload.action != 'WAIT') {
            fDebug.sessionPool[pool].replyBuffer = payload['default'];
         }
         return true;
      }
      
      var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
            .getService(Components.interfaces.nsIPromptService);
      
      var title = 'fDebug on '+session.server; 
      var inact = { value: false };
      dump('Default:'+payload['default']+'\n');
      
      switch (payload.action) {
         case 'WAIT': {
            fDebug.logMessage(session.server, 'Processing wait request');
            promptService.alertCheck(null, title, payload.msg, 'Disable interaction', inact);
            break;
         }
         case 'CONFIRM': {
            fDebug.logMessage(session.server, 'Processing confirm request');
            fDebug.sessionPool[pool].replyBuffer = promptService.confirmCheck(null, title, payload.msg, 'Disable interaction', inact) ? 'Y' : 'N';
            break;
         }
         case 'PROMPT': {
            fDebug.logMessage(session.server, 'Processing prompt request');
            var value = { value: payload['default'] };
            var rc = promptService.prompt(null, title, payload.msg, value, 'Disable interaction', inact);
            if (!rc) {
               value.value = payload['default'];
            }
            fDebug.sessionPool[pool].replyBuffer = value.value;
            break;
         }
         case 'PASSWORD': {
            fDebug.logMessage(session.server, 'Processing password request');
            var value = { value: payload['default'] };
            var rc = promptService.promptPassword(null, title, payload.msg, value, 'Disable interaction', inact);
            if (!rc) {
               value.value = payload['default'];
            }
            fDebug.sessionPool[pool].replyBuffer = value.value;
            break;
         }
         case 'SELECT': {
            fDebug.logMessage(session.server, 'Processing select request');
            var value = { value: payload.options.indexOf(payload['default']) };
            var rc = promptService.select(null, title, payload.msg, payload.options.length, payload.options, value);
            if (!rc) {
               value.value = payload.options.indexOf(payload['default']);
            }
            fDebug.sessionPool[pool].replyBuffer = payload.options[value.value];
            break;
         }
         default: {
            fDebug.logMessage(session.server, 'unkown interaction action (' + payload.action + ')');
            // dump('Unknown action: '+request.payload.action+'\n');
            return false;
         }
      }
      
      if (inact.value) {
         dump('Inact checked \n');
         fDebugSettings.interaction = false;
         fPreference.setValue("fdebug.interaction", false, 'BOOL');
         fDebug.sessionPool[pool].replyBuffer = payload['default'];
         dump('Default is:'+payload['default']+'\n');
      }
      return true;
   }
      
};