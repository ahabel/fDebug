
/**
 * fDebug Client Extension
 * 
 * fDebugSettings class
 * 
 * @author Arne Blankerts <theseer@fcms.de>
 * @copyright 2009-2010 fCMS Development Team
 * @license http://fcms.de/en/site/license.xml freepoint public license
 * @version %version
 * 
 */
var fDebugSettings = ({
   
   init: function() {

      this.contextlist = fPreference.getValue('fdebug.context.list', 'fCore').split(' ');
      this.color = {};
      if (this.contextlist.length > 0) {
         for ( var x = 0; x < this.contextlist.length; x++) {
            var t = this.contextlist[x];
            this.color[t] = fPreference.getValue("fdebug.color." + t, '#ccc');
         }
      }
   
      this.uuid = fPreference.getValue('fdebug.uuid', '');
      if (this.uuid == '') {
         var uuidGenerator = Components.classes["@mozilla.org/uuid-generator;1"].getService(Components.interfaces.nsIUUIDGenerator);
         this.uuid = uuidGenerator.generateUUID().toString();
         fPreference.setValue('fdebug.uuid', this.uuid, 'STRING');
      }
   
      this.contextshow  = fPreference.getValue("fdebug.context.show", false);
      this.contextlearn = fPreference.getValue("fdebug.context.learn", false);
   
      // general connection settings
      this.port       = fPreference.getValue("fdebug.port", 5005);
      this.autostart  = fPreference.getValue("fdebug.autostart", false);
      this.silent     = fPreference.getValue("fdebug.silent", false);
      this.tabs       = fPreference.getValue("fdebug.tabs", true);
      this.multi      = fPreference.getValue("fdebug.multi", true);
      this.details    = fPreference.getValue("fdebug.details", false);
      this.interaction= fPreference.getValue("fdebug.interaction", false);
      this.history    = fPreference.getValue("fdebug.history", 15);
   
      this.proxyenable = fPreference.getValue("fdebug.proxy.enable", false);
      this.proxyhost   = fPreference.getValue("fdebug.proxy.host", '');
      this.proxyport   = fPreference.getValue("fdebug.proxy.port", '5005');
   
      this.expireenable = fPreference.getValue("fdebug.expire.enable", false);
      this.expireremove = fPreference.getValue("fdebug.expire.remove", false);
      this.expirelimit  = fPreference.getValue("fdebug.expire.limit", '50');
   
      // whitelist & blacklist
      this.whitelist = fPreference.getValue('fdebug.whitelist', '127.0.0.1').split(' ').sort();
      this.blacklist = fPreference.getValue('fdebug.blacklist', '').split(' ').sort();
   
      // Display settings
      this.show = {
            message: fPreference.getValue('fdebug.show.message', true),
            warning: fPreference.getValue('fdebug.show.warning', true),
            error:   fPreference.getValue('fdebug.show.error', true),
            fatal:   fPreference.getValue('fdebug.show.fatal', true)            
      };      
      this.popup = fPreference.getValue('fdebug.display.popup', true);
      
      
      return this;
   }
   
}.init());