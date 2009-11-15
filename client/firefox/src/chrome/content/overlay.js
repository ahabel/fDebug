/**
 * fDebug Client Extension
 * 
 * Browser Overlay code
 * 
 * @author Arne Blankerts <theseer@fcms.de>
 * @copyright 2009 fCMS Development Team
 * @license http://fcms.de/en/site/license.xml freepoint public license
 * @version SVN: $Revision$
 * 
 */
function fDebugOpen() {
   openDialog("chrome://fdebug/content/fdebug/fdebug.xul", "fDebug",
         "chrome=yes,close=yes,dialog=no,resizable=yes,toolbar=yes,menubar=yes,status=yes");

}
