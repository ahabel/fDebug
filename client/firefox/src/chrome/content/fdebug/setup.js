/**
 * fDebug Client Extension
 * 
 * fdebug configuration class
 * 
 * @author Arne Blankerts <theseer@fcms.de>
 * @copyright 2009 fCMS Development Team
 * @license http://fcms.de/en/site/license.xml freepoint public license
 * @version SVN: $Revision$
 * 
 */
var fDebug = parent.fDebug;
var fDebugSetup = {

   init: function() {

      document.getElementById('conf:autostart').checked = fDebug.settings['autostart'];
      document.getElementById('conf:tabs').checked = fDebug.settings['tabs'];
      document.getElementById('conf:multi').checked = fDebug.settings['multi'];
      document.getElementById('conf:details').checked = fDebug.settings['details'];
      document.getElementById('conf:silent').checked = fDebug.settings['silent'];
      document.getElementById('conf:interaction').checked = fDebug.settings['interaction'];
      
      document.getElementById('conf:context:show').checked = fDebug.settings['contextshow'];
      document.getElementById('conf:context:learn').checked = fDebug.settings['contextlearn'];

      document.getElementById('conf:expire:enable').checked = fDebug.settings['expireenable'];
      document.getElementById('conf:expire:remove').checked = fDebug.settings['expireremove'];
      document.getElementById('conf:expire:limit').value = fDebug.settings['expirelimit'];

      document.getElementById('conf:proxy:enable').checked = fDebug.settings['proxyenable'];
      document.getElementById('conf:proxy:host').value = fDebug.settings['proxyhost'];
      document.getElementById('conf:proxy:port').value = fDebug.settings['proxyport'];

      document.getElementById('conf:port').value = fDebug.settings['port'];

      var merged = fDebug.settings['whitelist'].concat(fDebug.settings['blacklist']).sort();

      var iplist = document.getElementById('conf:iplist');
      for ( var x = 0; x < merged.length; x++) {
         if (merged[x] == '')
            continue;
         var mode = (fDebug.settings['blacklist'].indexOf(merged[x]) == -1 ? 'accept' : 'refuse');
         var item = iplist.appendItem(merged[x], mode);
         item.setAttribute('class', "listitem-iconic");
         item.setAttribute('image', "chrome://fdebug/content/gfx/" + mode + ".png");
      }

      var contextList = document.getElementById('conf:contextList')
      if (fDebug.settings['contextlist'].length > 0) {
         for ( var y = 0; y < fDebug.settings['contextlist'].length; y++) {
            var item = document.createElementNS(XULNS, 'richlistitem');
            var label = document.createElementNS(XULNS, 'label');
            label.setAttribute('value', fDebug.settings['contextlist'][y]);

            var picker = document.createElementNS(XULNS, 'colorpicker');
            picker.setAttribute('type', 'button');
            item.appendChild(picker);

            picker.setAttribute('style', 'width:100px;');
            picker.setAttribute('color', fDebug.settings['color'][fDebug.settings['contextlist'][y]]);
            picker.setAttribute('name', fDebug.settings['contextlist'][y]);
            picker.setAttribute('id', 'context:' + fDebug.settings['contextlist'][y]);
            picker.setAttribute('onchange', "fDebugSetup.onChange();");

            item.appendChild(label);
            contextList.appendChild(item);
            picker.color = picker.color; // work around colorpicker bug
         }
      }
   },

   onChange: function() {
      document.getElementById('but:revert').disabled = false;
      document.getElementById('but:save').disabled = false;
   },

   selectHost: function() {
      var obj = document.getElementById('conf:iplist').selectedItem;
      if (!obj)
         return;
      document.getElementById('currentIP').value = obj.label;

      document.getElementById('but:accept').disabled = false;
      document.getElementById('but:refuse').disabled = false;
      document.getElementById('but:remove').disabled = false;
   },

   adaptHost: function(mode) {
      this.onChange();
      var cur = document.getElementById('currentIP');
      var obj = document.getElementById('conf:iplist').selectedItem;
      if (!obj || cur.value != obj.label) {
         obj = document.getElementById('conf:iplist').appendItem(cur.value, mode);
         obj.setAttribute('class', "listitem-iconic");
      }
      obj.setAttribute('image', "chrome://fdebug/content/gfx/" + mode + ".png");
      obj.setAttribute('value', mode);
      cur.value = '';
      obj.parentNode.selectedItem = obj;
      this.selectHost();
   },

   acceptHost: function() {
      this.adaptHost('accept');
   },

   refuseHost: function() {
      this.adaptHost('refuse');
   },

   removeHost: function() {
      var obj = document.getElementById('conf:iplist');
      obj.removeItemAt(obj.selectedIndex);
      document.getElementById('currentIP').value = '';
      document.getElementById('but:accept').disabled = true;
      document.getElementById('but:refuse').disabled = true;
      document.getElementById('but:remove').disabled = true;
      this.onChange();
   },

   verifyHost: function(obj) {
      // TODO: regex check?
      if (obj.value.length < 6) {
         document.getElementById('but:accept').disabled = true;
         document.getElementById('but:refuse').disabled = true;
      } else {
         document.getElementById('but:accept').disabled = false;
         document.getElementById('but:refuse').disabled = false;
      }
   },

   selectContext: function() {
      var obj = document.getElementById('conf:contextList');
      var text = document.getElementById('currentContext');
      if (obj.selectedIndex == -1) {
         document.getElementById('but:ctxremove').disabled = true;
         text.value = '';
         text.disabled = true;
         return;
      }
      var i = obj.selectedItem;
      text.value = i.getElementsByTagName('label')[0].value; // getAttribute('label');
      text.removeAttribute('disabled');
      var x = i.getElementsByTagName('colorpicker')[0];
      x.color = x.getAttribute('color');
      document.getElementById('but:ctxremove').disabled = false;
   },

   removeContext: function() {
      var obj = document.getElementById('conf:contextList');
      obj.removeChild(obj.selectedItem);
      this.selectContext();
      this.onChange();
   },

   verifyContext: function() {
      var obj = document.getElementById('currentContext');
      document.getElementById('but:ctxupdate').disabled = (obj.value == '');
   },

   updateContext: function() {
      var obj = document.getElementById('currentContext');
      var item = document.getElementById('conf:contextList').selectedItem;
      item.getElementsByTagName('label')[0].value = obj.value;
      item.getElementsByTagName('colorpicker')[0].setAttribute('name', obj.value);
      document.getElementById('conf:contextList').selectedIndex = -1;
      document.getElementById('but:ctxupdate').disabled = true;
      this.onChange();
   },

   revertAll: function() {
      var x = document.getElementById('conf:iplist');
      for ( var y = x.getRowCount() - 1; y >= 0; y--) {
         x.removeItemAt(y);
      }
      x = document.getElementById('conf:contextList');
      for (y = x.getRowCount() - 1; y >= 0; y--) {
         x.removeItemAt(y);
      }
      document.getElementById('but:revert').disabled = true;
      document.getElementById('but:save').disabled = true;
      this.init();
   },

   saveSettings: function() {

      // proxy settings
      fPreference.setValue('fdebug.proxy.enable', document.getElementById('conf:proxy:enable').checked, 'BOOL');
      fPreference.setValue('fdebug.proxy.host', document.getElementById('conf:proxy:host').value, 'STRING');
      fPreference.setValue('fdebug.proxy.port', document.getElementById('conf:proxy:port').value, 'STRING');

      // general
      fPreference.setValue('fdebug.autostart', document.getElementById('conf:autostart').checked, 'BOOL');
      fPreference.setValue('fdebug.tabs', document.getElementById('conf:tabs').checked, 'BOOL');
      fPreference.setValue('fdebug.multi', document.getElementById('conf:multi').checked, 'BOOL');
      fPreference.setValue('fdebug.silent', document.getElementById('conf:silent').checked, 'BOOL');
      fPreference.setValue('fdebug.details', document.getElementById('conf:details').checked, 'BOOL');
      fPreference.setValue('fdebug.interaction', document.getElementById('conf:interaction').checked, 'BOOL');
      
      fPreference.setValue('fdebug.expire.enable', document.getElementById('conf:expire:enable').checked, 'BOOL');
      fPreference.setValue('fdebug.expire.remove', document.getElementById('conf:expire:remove').checked, 'BOOL');
      fPreference.setValue('fdebug.expire.limit', document.getElementById('conf:expire:limit').value, 'STRING');

      fPreference.setValue('fdebug.context.learn', document.getElementById('conf:context:learn').checked, 'BOOL');
      fPreference.setValue('fdebug.context.show', document.getElementById('conf:context:show').checked, 'BOOL');

      fPreference.setValue('fdebug.port', document.getElementById('conf:port').value, 'INT');

      var lists = {
         black: [],
         white: []
      };
      var listbox = document.getElementById('conf:iplist');
      for ( var x = 0; x < listbox.getRowCount(); x++) {
         var o = listbox.getItemAtIndex(x);
         lists[(o.value == 'accept' ? 'white' : 'black')].push(o.label);
      }
      fPreference.setValue('fdebug.whitelist', lists['white'].join(' '), 'STRING');
      fPreference.setValue('fdebug.blacklist', lists['black'].join(' '), 'STRING');

      var contextList = document.getElementById('conf:contextList').getElementsByTagName('colorpicker');
      fDebug.settings['contextlist'] = [];
      for ( x = 0; x < contextList.length; x++) {
         o = contextList[x];
         fPreference.setValue('fdebug.color.' + o.getAttribute('name'), o.color, 'STRING');
         fDebug.settings['color'][o.getAttribute('name')] = o.color;
         fDebug.settings['contextlist'].push(o.getAttribute('name'));
      }
      fPreference.setValue('fdebug.context.list', fDebug.settings['contextlist'].join(' '), 'STRING');

      // new port?
      var restart = false;
      if ((fDebug.settings['port'] != document.getElementById('conf:port').value || document
            .getElementById('conf:proxy:enable').checked)
            && fDebug.socket) {
         fDebug.stopService();
         restart = true;
      }

      // communicate back ;)
      fDebug.settings['port'] = fPreference.getValue("fdebug.port", 5005);
      fDebug.settings['autostart'] = fPreference.getValue("fdebug.autostart", false);
      fDebug.settings['silent'] = fPreference.getValue("fdebug.silent", false);

      fDebug.settings['contextshow'] = fPreference.getValue("fdebug.context.show", false);
      fDebug.settings['contextlearn'] = fPreference.getValue("fdebug.context.learn", false);

      fDebug.settings['tabs'] = fPreference.getValue("fdebug.tabs", true);
      fDebug.settings['multi'] = fPreference.getValue("fdebug.multi", true);
      fDebug.settings['details'] = fPreference.getValue("fdebug.details", false);
      fDebug.settings['interaction'] = fPreference.getValue("fdebug.interaction", false);

      fDebug.settings['history'] = fPreference.getValue("fdebug.history", 15);
      fDebug.settings['whitelist'] = fPreference.getValue('fdebug.whitelist', '127.0.0.1').split(' ').sort();
      fDebug.settings['blacklist'] = fPreference.getValue('fdebug.blacklist', '').split(' ').sort();

      fDebug.settings['proxyenable'] = fPreference.getValue("fdebug.proxy.enable", false);
      fDebug.settings['proxyhost'] = fPreference.getValue("fdebug.proxy.host", '');
      fDebug.settings['proxyport'] = fPreference.getValue("fdebug.proxy.port", '5005');

      fDebug.settings['expireenable'] = fPreference.getValue("fdebug.expire.enable", false);
      fDebug.settings['expireremove'] = fPreference.getValue("fdebug.expire.remove", false);
      fDebug.settings['expirelimit'] = fPreference.getValue("fdebug.expire.limit", '50');

      document.getElementById('but:revert').disabled = true;
      document.getElementById('but:save').disabled = true;

      if (restart) {
         fDebug.startService();
      }

   }

};
