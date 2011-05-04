/**
 * fDebug Client Extension
 * 
 * fdebug session class
 * 
 * @author Arne Blankerts <theseer@fcms.de>
 * @copyright 2009 fCMS Development Team
 * @license http://fcms.de/en/site/license.xml freepoint public license
 * @version SVN: $Revision$
 * 
 */
var fDebug = parent.fDebug;
var fDebugSettings = parent.fDebugSettings;

var fDebugSession = {

   server: '',

   poolMap: [],
   currentPool: null,
   currentItem: null,

   processCount: 0,

   currentColor: '#fff',

   init: function() {
      // nothing to do right now...
   },

   handleRequest: function(pool, req) {
      if (this.server == '') {
         this.server = fDebug.sessionPool[pool].server;
         document.title = this.server;
      }
      if (!this.poolMap[pool]) {
         var panel = this.buildPanel();
         var pList = document.getElementById('poolList');
         var item = pList.appendItem(fDebug.sessionPool[pool].url, pool);
         item.setAttribute('class', "listitem-iconic");
         item.setAttribute('image', 'chrome://fdebug/content/gfx/busy.gif');
         this.poolMap[pool] = {
            isLive: true,
            item: item,
            panel: panel,
            variables: null,
            source: null,
            filter: '',
            url: fDebug.sessionPool[pool].url,
            host: fDebug.sessionPool[pool].server
         };

         if (fDebugSettings.expireenable) {
            var c = pList.getRowCount();
            // dump('Pool count:' + c + '\n');
            if (c > fDebugSettings.expirelimit) {
               var toClear = pList.getItemAtIndex(c - fDebugSettings.expirelimit - 1).value;
               // dump('Pool limit reached - removing pool:' + toClear + '\n');
               var x = this.poolMap[toClear].panel;
               x.parentNode.removeChild(x);
               if (fDebugSettings.expireremove) {
                  x = this.poolMap[toClear].item;
                  x.parentNode.removeChild(x);
               } else {
                  this.poolMap[toClear].item.setAttribute('image', 'chrome://fdebug/content/gfx/clear.png');
                  this.poolMap[toClear].item.setAttribute('class', "listitem-iconic");
                  this.poolMap[toClear].item.setAttribute('disabled', "true");
               }
               this.poolMap[toClear] = {};
            }
         }

         this.processCount++;
         if (this.processCount == 1) {
            fDebugSession.switchPanel(pool);
         }

         if (parent.document.getElementById('conf:live').getAttribute('checked') != 'true') {
            this.poolMap[pool].isLive = false;
            this.toggleLive(pool);
         }
      }

      if (!this.poolMap[pool].panel) {
         // either create failed or panel got removed due to limit, so let's
         // ignore this message
         return true;
      }

      switch (req.type) {
         case 'MESSAGE': {
            this.addMessage(this.poolMap[pool].panel, req);
            break;
         }
         case 'VARIABLES': {
            this.addVariables(pool, req);
            break;
         }
         case 'SOURCE': {
            this.addSource(pool, req);
            break;
         }
      }
      return true;
   },

   notifyFinish: function(pool) {
      if (this.poolMap[pool]) {
         this.addTimerMessage(this.poolMap[pool].panel, 'Trace finished at');
         this.processCount--;
         this.poolMap[pool].item.removeAttribute('class');
         this.poolMap[pool].isLive = true;
         this.toggleLive(pool);
      }
      return true;
   },

   notifyClose: function() {
      fDebug.notifyClose(this.server);
   },

   toggleLive: function(pool) {
      // this.isLive=(parent.document.getElementById('conf:live').getAttribute('checked')=='true');
      document.getElementById('displayDeck').selectedIndex = (this.poolMap[pool].isLive ? 0 : 3);
      this.poolMap[pool].panel.collapsed = !this.poolMap[pool].isLive;
   },

   buildPanel: function() {
      var groupbox = document.createElementNS(XULNS, 'groupbox');
      var richlist = document.createElementNS(XULNS, 'richlistbox');
      richlist.setAttribute('flex', '1');
      richlist.setAttribute('context', 'processMenu');
      richlist.setAttribute('onselect', 'fDebugSession.itemSelect(this);');
      groupbox.appendChild(richlist);
      document.getElementById('processingDeck').appendChild(groupbox);

      this.addTimerMessage(richlist, 'Trace started at');

      return richlist;
   },

   addTimerMessage: function(listbox, text) {
      var timeStamp = new Date().toLocaleString();
      var request = {
         payload: {
            level: 'TIMER',
            message: text + ' ' + timeStamp,
            method: '',
            'class': '',
            type: '',
            file: '',
            line: '',
            version: ''
         }
      };
      this.addMessage(listbox, request);
   },

   switchPanel: function(pool) {      
      document.getElementById('processFilter').value = '';
      var deck = document.getElementById('displayDeck');

      if (this.poolMap[pool] && this.poolMap[pool].panel) {
         this.currentPool = pool;
         document.getElementById('clearBCAST').setAttribute('disabled', 'false');
         document.getElementById('detailGroup').collapsed = true;
         document.getElementById('processingDeck').selectedPanel = this.poolMap[pool].panel.parentNode;
         document.getElementById('variablesButton').disabled = !(this.poolMap[pool].variables);
         document.getElementById('sourceButton').disabled = !(this.poolMap[pool].source);
         document.getElementById('processFilter').value = this.poolMap[pool].filter;

         setTimeout(function() {
            document.getElementById('poolList').selectItem(fDebugSession.poolMap[pool].item);
         }, 1);
         document.getElementById('searchGroup').setAttribute('collapsed', 'false');
         switch (deck.selectedIndex) {
            case '0': {
               break;
            }
            case '1': {
               if (!this.poolMap[pool].variables) {
                  deck.selectedIndex = 0;
                  document.getElementById('processButton').checked = true;
               } else {
                  this.displayVariables();
               }
               break;
            }
            case '2': {
               if (!this.poolMap[pool].source) {
                  deck.selectedIndex = 0;
                  document.getElementById('processButton').checked = true;
               } else {
                  this.displaySource();
               }
               break;
            }
            case '4': {
               deck.selectedIndex = 0;
               document.getElementById('processButton').checked = true;
            }
         }

      } else {
         document.getElementById('variablesButton').disabled = true;
         document.getElementById('sourceButton').disabled = true;
         deck.selectedIndex = 4;
      }

   },

   addMessage: function(listbox, request) {

      try {

         var data = request.payload;

         if ( [ 'message', 'warning', 'error', 'fatal', 'timer' ].indexOf(data.level.toLowerCase()) == -1) {
            throw 'Unknown message level "' + data.level + '" received';
         }

         // skip unwanted items
         if (data.level != 'TIMER'
               && parent.document.getElementById('conf:' + data.level.toLowerCase()).getAttribute('checked') != 'true') {
            // dump('message of unwanted type - skipping\n');
            return;
         }

         var layout;
         switch (data.level) {
            case 'MESSAGE': {
               layout = {
                  bg: false,
                  css: 'entrymessage',
                  icon: 'info'
               };
               break;
            }
            case 'WARNING': {
               layout = {
                  bg: false,
                  css: 'entrywarning',
                  icon: 'warning'
               };
               break;
            }
            case 'ERROR': {
               layout = {
                  bg: false,
                  css: 'entryerror',
                  icon: 'error'
               };
               this.toFront();
               break;
            }
            case 'FATAL': {
               layout = {
                  bg: '#ff0000',
                  css: 'entryfatal',
                  icon: 'error'
               };
               this.toFront();
               break;
            }
            case 'TIMER': {
               layout = {
                  bg: '#cccccc',
                  css: 'entrytimer',
                  icon: 'clock'
               };
               break;
            }
         }

         var item = document.createElementNS(XULNS, 'richlistitem');
         item.setAttribute('style', "border-bottom:1px solid #AAA;");
         item.setAttribute('class', layout.css);

         item.setAttribute('flevel', data['level']);
         item.setAttribute('fclass', data['class']);
         item.setAttribute('fmethod', data['method']);
         item.setAttribute('fcall', data['type']);
         item.setAttribute('ffile', data['file']);
         item.setAttribute('fline', data['line']);
         item.setAttribute('fversion', data['version']);

         var hbox = document.createElementNS(XULNS, 'hbox');
         hbox.setAttribute('flex', '1');
         item.appendChild(hbox);

         if (fDebugSettings.contextshow) {
            if (data.context) {
               if (fDebugSettings.color[data.context]) {
                  this.currentColor = parent.fDebugSettings.color[data.context];
               } else {
                  if (!fDebugSettings.contextlearn) {
                     fDebugSettings.color[data.context] = '#ccc';
                     fDebugSettings.contextlist.push(data.context);
                     fDebug.logMessage(this.server,
                           'Learned new context "' + data.context + '" - created temporary entry with default color.');
                  }
               }
            }
            hbox.setAttribute('style', 'width:5px; border-left:5px solid ' + this.currentColor + '; padding-left:2px;');
         } else {
            hbox.setAttribute('style', 'width:5px; padding-left:2px;');
         }

         var ibox = document.createElementNS(XULNS, 'vbox');
         ibox.setAttribute('style', 'padding-left:2px; padding-top:2px;');

         var image = document.createElementNS(XULNS, 'image');
         image.setAttribute('src', 'chrome://fdebug/content/gfx/' + layout.icon + '16.png');
         ibox.appendChild(image);

         hbox.appendChild(ibox);

         var vbox = document.createElementNS(XULNS, 'vbox');
         vbox.setAttribute('style', 'padding-left:4px;');
         vbox.setAttribute('flex', '1');

         var msgList = data.message.split('\n');
         var label = document.createElementNS(XULNS, 'label');
         label.setAttribute('value', msgList[0]);
         label.setAttribute('class', layout.css);
         vbox.appendChild(label);

         if (msgList.length > 1) {
            var img = document.createElementNS(XULNS, 'image');
            img.setAttribute('src', 'chrome://fdebug/content/gfx/expanded.png');
            var self=this;
            img.onclick=function(){self.toggleCurrent();};
            ibox.appendChild(img);

            var subbox = document.createElementNS(XULNS, 'vbox');
            subbox.setAttribute('flex', '1');
            if (!fDebugSettings.details) {
               subbox.setAttribute('collapsed', 'true');
               img.setAttribute('src', 'chrome://fdebug/content/gfx/right.png');
            }
            for (var x = 1; x < msgList.length; x++) {
               var sublabel = document.createElementNS(XULNS, 'label');
               sublabel.setAttribute('value', msgList[x]);
               subbox.appendChild(sublabel);
            }
            vbox.appendChild(subbox);
         }

         var label = document.createElementNS(XULNS, 'label');
         label.setAttribute('value', data.class + data.type + data.method);
         label.setAttribute('style', 'font-size:11px; text-align:right;');
         vbox.appendChild(label);

         hbox.appendChild(vbox);

         item.appendChild(hbox);

         listbox.appendChild(item);
         window.setTimeout(function() { listbox.ensureElementIsVisible(item); }, 0);

      } catch (e) {
         fDebug.logMessage(this.server, 'Warning: Exception on handling payload:' + e);
         // dump('addMessage: Exception ' + e);
      }

   },

   displayProcess: function() {
      document.getElementById('displayDeck').selectedIndex = 0;
      document.getElementById('processButton').checked = true;
   },

   addVariables: function(pool, request) {
      var parser = new DOMParser();
      //dump('AddVariables: ' + request.payload['xml'] + '\n');
      
      if (!this.poolMap[pool].variables) {
         this.poolMap[pool].variables = parser.parseFromString('<?xml version="1.0" ?><container />', 'text/xml');
      }

      var vars = parser.parseFromString(request.payload['xml'],'text/xml');
      this.poolMap[pool].variables.documentElement.appendChild(vars.documentElement);
      
      if (pool == this.currentPool) {
         document.getElementById('variablesButton').disabled = false;
      }
   },

   displayVariables: function() {
      var obj = document.getElementById('variables');
      obj.update(this.poolMap[this.currentPool].variables);
      document.getElementById('displayDeck').selectedIndex = 1;
      document.getElementById('variablesButton').checked = true;
   },

   addSource: function(pool, request) {
      this.poolMap[pool].source = request.payload['xml'];
      if (pool == this.currentPool) {
         document.getElementById('sourceButton').disabled = false;
      }
   },

   displaySource: function() {
      var obj = document.getElementById('source').contentDocument.getElementById('source');
      obj.xml = this.poolMap[this.currentPool].source;
      obj.update();
      document.getElementById('displayDeck').selectedIndex = 2;
      document.getElementById('sourceButton').checked = true;
   },

   clearPanel: function() {
      var pList = document.getElementById('poolList');
      for ( var x = pList.getRowCount() - 1; x >= 0; x--) {
         pList.removeItemAt(x);
      }

      var pDeck = document.getElementById('processingDeck');
      var blank = document.createElementNS(XULNS, 'deck');
      blank.setAttribute('id', 'processingDeck');
      blank.setAttribute('flex', '1');

      pDeck.parentNode.replaceChild(blank, pDeck);

      document.getElementById('variablesButton').disabled = true;
      document.getElementById('sourceButton').disabled = true;
      document.getElementById('processButton').checked = true;
      document.getElementById('displayDeck').selectedIndex = 0;
      document.getElementById('detailGroup').collapsed = true;
      document.getElementById('clearBCAST').setAttribute('disabled', 'true');
      document.getElementById('searchGroup').setAttribute('collapsed', 'true');
   },

   removeCurrent: function() {
      var pList = document.getElementById('poolList');
      if (pList.selectedIndex == -1)
         return;

      if (pList.getRowCount() == 1) {
         this.clearPanel();
         return;
      }
      pList.removeItemAt(pList.selectedIndex);
      var pDeck = document.getElementById('processingDeck');
      pDeck.removeChild(pDeck.selectedPanel);

      pDeck.selectedIndex = 0;
      pList.selectedIndex = 0;
   },

   filterList: function() {
      this.poolMap[this.currentPool].filter = document.getElementById('processFilter').value;
      var filter = this.poolMap[this.currentPool].filter.toLowerCase();
      var richlist = this.poolMap[this.currentPool].panel;

      for ( var x = 0; x < richlist.getRowCount(); x++) {
         var show = false;
         var item = richlist.getItemAtIndex(x);
         var list = item.getElementsByTagNameNS(XULNS, 'label');
         for ( var t = 0; t < list.length; t++) {
            if (list[t].value.toLowerCase().indexOf(filter) != -1) {
               show = true;
            }
         }
         item.hidden = !show;
      }
   },
   
   toggleCurrent: function() {
      var vbox = this.currentItem.getElementsByTagName('vbox')[2];
      if (vbox) {
         if (vbox.hasAttribute('collapsed')) {
            vbox.removeAttribute('collapsed');
            this.currentItem.getElementsByTagName('image')[1].src='chrome://fdebug/content/gfx/expanded.png';            
         } else {
            vbox.setAttribute('collapsed', 'true');
            this.currentItem.getElementsByTagName('image')[1].src='chrome://fdebug/content/gfx/right.png';
         }
      }
   },

   itemSelect: function(listbox) {
      
      if (this.currentItem && !fDebugSettings.details) {
         var vbox = this.currentItem.getElementsByTagName('vbox')[2];
         if (vbox) {
            vbox.setAttribute('collapsed', 'true');
            this.currentItem.getElementsByTagName('image')[1].src='chrome://fdebug/content/gfx/right.png';
         }
      }

      var obj = listbox.selectedItem;
      this.currentItem = obj;
      if (!obj || (obj.getAttribute('flevel') == 'TIMER')) {
         document.getElementById('detailGroup').setAttribute('collapsed', 'true');
         return;
      }

      var line1 = obj.getAttribute('fclass') + obj.getAttribute('fcall') + obj.getAttribute('fmethod') + '()';
      var line2 = 'Line ' + obj.getAttribute('fline') + ' in ' + obj.getAttribute('ffile');
      var line3 = obj.getAttribute('fversion');
      document.getElementById('detailText1').value = line1;
      document.getElementById('detailText2').value = line2;
      document.getElementById('detailText3').value = line3;
      document.getElementById('detailGroup').removeAttribute('collapsed');
      
      var vbox = obj.getElementsByTagName('vbox')[2];
      if (vbox) {
         vbox.removeAttribute('collapsed');
         obj.getElementsByTagName('image')[1].src='chrome://fdebug/content/gfx/expanded.png';
      }
      
      listbox.ensureSelectedElementIsVisible();
   },

   toFront: function() {
      if (parent.document.getElementById('conf:popup').getAttribute('checked') != 'true') {
         return;
      }
      // dump('setting to front!\n');
      parent.focus();
      fDebug.cmsTabBox.selectedTab = fDebug.sessionPool[this.currentPool].tab;
   },

   copyText: function() {
      if (!this.currentItem)
         return;
      var data = [];

      data.push(this.currentItem.getAttribute('flevel'), '', document.getElementById('detailText1').value, document
            .getElementById('detailText2').value, document.getElementById('detailText3').value, '');

      var list = this.currentItem.getElementsByTagName('label');
      // skip last line, we don't need it ;)
      for ( var x = 0; x < list.length - 1; x++) {
         data.push(list[x].value);
      }
      data.push('');

      var obj = Components.classes["@mozilla.org/widget/clipboardhelper;1"]
            .getService(Components.interfaces.nsIClipboardHelper);
      obj.copyString(data.join('\n'));

   },

   copyPath: function() {
      var obj = Components.classes["@mozilla.org/widget/clipboardhelper;1"]
            .getService(Components.interfaces.nsIClipboardHelper);
      obj.copyString(document.getElementById('poolList').selectedItem.label);
   },

   saveToFile: function() {

      var timeStamp = new Date().toLocaleString();

      var nsIFilePicker = Components.interfaces.nsIFilePicker;
      var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
      fp.init(window, "Save process log", nsIFilePicker.modeSave);
      fp.defaultString = 'process.log';

      var ret = fp.show();

      if (ret == nsIFilePicker.returnOK || ret == nsIFilePicker.returnReplace) {

         var richlist = this.poolMap[this.currentPool].panel;
         var text = 'Process Log Export\n\n';

         text += 'Host: ' + this.poolMap[this.currentPool].host + '\n';
         text += 'URL: ' + this.poolMap[this.currentPool].url + '\n';
         text += 'Date: ' + timeStamp + '\n\n';
         text += '===============================================================================================\n\n';

         for ( var x = 0; x < richlist.getRowCount(); x++) {
            var item = richlist.getItemAtIndex(x);

            text += item.getAttribute('flevel') + '\n';
            text += item.getAttribute('fclass') + item.getAttribute('fcall') + item.getAttribute('fmethod') + '()\n';
            text += 'Line ' + item.getAttribute('fline') + ' in ' + item.getAttribute('ffile') + '\n';
            text += item.getAttribute('fversion') + '\n\n';

            var list = item.getElementsByTagNameNS(XULNS, 'label');

            for ( var t = 0; t < list.length - 1; t++) {
               text += list[t].value + '\n';
            }

            text += '\n-----------------------------------------------------------------------------------------------\n';

         }
         if (fp.file.exists()) {
            fp.file.remove(false);
         }
         fp.file.create(0x00, 0644);

         var trans = Components.classes["@mozilla.org/network/file-output-stream;1"]
               .createInstance(Components.interfaces.nsIFileOutputStream);
         trans.init(fp.file, 0x04 | 0x08 | 0x10, 064, 0);
         trans.write(text, text.length);
         trans.close();
      }
   }
};
