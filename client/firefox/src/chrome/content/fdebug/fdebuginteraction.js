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
      switch (payload.action) {
         case 'CONFIRM': {
            fDebug.logMessage(session.server, 'Processing confirm request');
            fDebug.sessionPool[pool].replyBuffer = confirm(payload.msg) ? 'Y' : 'N';
            break;
         }
         case 'PROMPT': {
            fDebug.logMessage(session.server, 'Processing prompt request');
            fDebug.sessionPool[pool].replyBuffer = prompt(payload.msg);
            break;
         }
         default: {
            this.logMessage(session.server, 'unkown interaction action (' + payload.action + ')');
            // dump('Unknown action: '+request.payload.action+'\n');
            return false;
         }
      }
      return true;
   }
      
};