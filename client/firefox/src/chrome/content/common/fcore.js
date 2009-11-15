/**
 * fDebug Client Extension
 * 
 * Shared Code from fCMS Extension
 * 
 * @author Arne Blankerts <theseer@fcms.de>
 * @copyright 2009 fCMS Development Team
 * @license http://fcms.de/en/site/license.xml freepoint public license
 * @version SVN: $Revision$
 * 
 */
const XULNS = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';

var fCore = {

   consoleService: Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService),
   
   jsService: Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces["mozIJSSubScriptLoader"]),
   
   loadedScript: new Array(),

   // --------------------------------------------------------------------------------------------------------------
   // send message to js console
   debug: function(msg) { // debug msg to js console
      this.consoleService.logStringMessage(msg);
   },

   // --------------------------------------------------------------------------------------------------------------
   // include javascript from url
   include: function(scriptPath) {
      if (!this.loadedScript[scriptPath]) {
         try {
            this.jsService.loadSubScript(scriptPath);
            this.loadedScript[scriptPath] = true;
         } catch (e) {
            this.debug('Error in include: ' + scriptPath + '\n' + e);
            return false;
         }
      }
      return true;
   },

   // --------------------------------------------------------------------------------------------------------------
   // strip tags from string
   stripTags: function(str) {
      return str.replace(/<\/?[^>]+>/gi, '');
   },

   // --------------------------------------------------------------------------------------------------------------
   // get a subset from arguments object as array
   sliceArgs: function(args, slice, count) {
      if (args.length < slice) {
         return null;
      }
      var params = new Array();
      for ( var t = slice; t < args.length; t++) {
         params.push(args[t]);
         if (count && params.length == count) {
            break;
         }
      }
      return params;
   },

   // --------------------------------------------------------------------------------------------------------------
   // extend object
   extend: function(obj, properties) {
      for ( var property in properties) {
         obj[property] = properties[property];
      }
   },

   // --------------------------------------------------------------------------------------------------------------
   // execute Dialog and return result or false if canceled
   execDialog: function(dialog, title, param) {
      var comObj = {
         input: param,
         resMode: false,
         resData: null
      };
      openDialog(dialog, title, 'chrome,titlebar,toolbar,centerscreen,modal,resizable', comObj);
      if (!comObj.resMode) {
         return false;
      }
      return comObj.resData;
   },

   // --------------------------------------------------------------------------------------------------------------
   // remove 'disabled' attribute from given element ids (array)
   enableCommands: function(list) {
      for ( var key in list) {
         if (document.getElementById(list[key])) {
            document.getElementById(list[key]).removeAttribute('disabled');
         }
      }
   },

   // --------------------------------------------------------------------------------------------------------------
   // set 'disabled' attribute for given element ids (array)
   disableCommands: function(list) {
      for ( var key in list) {
         if (document.getElementById(list[key])) {
            document.getElementById(list[key]).setAttribute('disabled', 'true');
         }
      }
   },

   // --------------------------------------------------------------------------------------------------------------
   // check wether one of the given elements has disabled==true
   isDisabled: function(list) {
      var rc = false;
      for ( var key in list) {
         if (document.getElementById(list[key])) {
            if (document.getElementById(list[key]).getAttribute('disabled') == 'true') {
               rc = true;
               break;
            }
         }
      }
      return rc;
   },

   // --------------------------------------------------------------------------------------------------------------
   // load a file and return its content
   readFile: function(str_Filename, maxsize) {

      try {
         var obj_File = Components.classes["@mozilla.org/file/local;1"]
               .createInstance(Components.interfaces.nsILocalFile);
         obj_File.initWithPath(str_Filename);

         if (maxsize && obj_File.fileSize > maxsize) {
            dump('Filesize exceeds given maximum filesize - aborting read\n');
            return '';
         }

         var obj_InputStream = Components.classes["@mozilla.org/network/file-input-stream;1"]
               .createInstance(Components.interfaces.nsIFileInputStream);
         obj_InputStream.init(obj_File, 0x01, 0444, null);

         var obj_ScriptableIO = Components.classes["@mozilla.org/scriptableinputstream;1"]
               .createInstance(Components.interfaces.nsIScriptableInputStream);
         obj_ScriptableIO.init(obj_InputStream);

      } catch (e) {
         alert(e);
      }

      try {
         var str = obj_ScriptableIO.read(obj_File.fileSize);
      } catch (e) {
         dump(e);
      }

      obj_ScriptableIO.close();
      obj_InputStream.close();

      return str;
   },

   readBinaryFile: function(str_Filename, maxsize) {

      dump('readBinaryFile: max size -> ' + maxsize + '\n');

      var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
      file.initWithPath(str_Filename);

      dump('File size:' + file.fileSize + '\n');

      if (maxsize && file.fileSize > maxsize) {
         dump('Filesize exceeds given maximum filesize - aborting read\n');
         return '';
      }

      var stream = Components.classes["@mozilla.org/network/file-input-stream;1"]
            .createInstance(Components.interfaces.nsIFileInputStream);
      stream.init(file, 0x01, 00004, null);

      var bstream = Components.classes["@mozilla.org/network/buffered-input-stream;1"].getService();
      bstream.QueryInterface(Components.interfaces.nsIBufferedInputStream);
      bstream.init(stream, 1000);
      bstream.QueryInterface(Components.interfaces.nsIInputStream);

      var binary = Components.classes["@mozilla.org/binaryinputstream;1"]
            .createInstance(Components.interfaces.nsIBinaryInputStream);
      binary.setInputStream(stream);

      var str = binary.readBytes(binary.available())

      binary.close();
      bstream.close();
      stream.close();

      return str;
   },

   handleException: function(msg, trace) {

      // find possible fcms:coreWindow
      var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
            .getService(Components.interfaces.nsIWindowMediator);
      var fcmsWindow = wm.getMostRecentWindow("fcms::core");
   
      // check for debug setting
      var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
      var showTrace = false;
      if (prefs.getPrefType('fcms.debug.trace') == prefs.PREF_BOOL) {
         showTrace = prefs.getBoolPref('fcms.debug.trace');
      }
   
      if (!showTrace) {
         alert('Exception caught:\n\n' + msg);
         return;
      }
   
      if (!fcmsWindow) {
         if (showTrace) {
            alert('Exception caught:\n\n' + msg + '\n\n' + trace);
         } else {
            alert('Exception caught:\n\n' + msg);
         }
         return;
      }
   
      alert('Exception caught:\n\n' + msg + '\n\nServer: ' + fcmsWindow.serverURL + '\nUser: ' + fcmsWindow.currentUser
            + '\nModule: ' + fcmsWindow.currentModule + ' v' + fcmsWindow.currentModuleVersion + '\n\nTrace: ' + trace);
   
   }

};
