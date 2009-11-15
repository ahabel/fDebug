/**
 * fDebug Client Extension
 * 
 * Shared Code from fCMS Extension - Simple preference access helper class
 * 
 * @author Arne Blankerts <theseer@fcms.de>
 * @copyright 2009 fCMS Development Team
 * @license http://fcms.de/en/site/license.xml freepoint public license
 * @version SVN: $Revision$
 * 
 */
var fPreference = {

   prefService: Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch),

   getValue: function(key, def) {

      var value;
      try {
         switch (this.prefService.getPrefType(key)) {

            case this.prefService.PREF_BOOL: {
               value = this.prefService.getBoolPref(key);
               break;
            }
            case this.prefService.PREF_INT: {
               value = this.prefService.getIntPref(key);
               break;
            }
            case this.prefService.PREF_STRING: {
               value = this.prefService.getCharPref(key);
               break;
            }
            default: {
               value = (def != undefined) ? def : null;
            }
         }
      } catch (e) {
         value = (def != undefined) ? def : null;
      }

      return value;
   },

   setValue: function(key, val, type) {

      if (!type) {
         type = this.prefService.getPrefType(key);
      }

      switch (type) {
         case 'BOOL':
         case this.prefService.PREF_BOOL: {
            this.prefService.setBoolPref(key, val);
            break;
         }
         case 'INT':
         case this.prefService.PREF_INT: {
            this.prefService.setIntPref(key, val);
            break;
         }
         case 'STRING':
         case this.prefService.PREF_STRING: {
            this.prefService.setCharPref(key, val);
            break;
         }
         default: {
            fCore.debug('illegal pref type: ' + type + ' (val: ' + val + ' - key: ' + key + ')');
         }
      }
   },

   removeValue: function(key) {
      if (this.prefService.prefHasUserValue(key)) {
         this.prefService.clearUserPref(key);
      }
   }
   
};