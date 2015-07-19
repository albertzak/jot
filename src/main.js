"use strict";

var app           = require('app');
var BrowserWindow = require('browser-window');
var ipc           = require('ipc');
var dialog        = require('dialog');
var fs            = require('fs');
var blob          = require('blob');
var mime          = require('mime');

require('crash-reporter').start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.
var mainWindow = null;

app.on('window-all-closed', function() {
  // On OSX it is common for applications and their menu bar 
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform != 'darwin') {
    app.quit();
  }
});

app.on('ready', function() {
  var electronScreen = require('screen');
  var display = electronScreen.getPrimaryDisplay().workAreaSize;
  mainWindow = new BrowserWindow({
    x: display.x + 50,
    y: display.y + 50,
    width: display.width - 100,
    height: display.height - 100,
    'min-width': 560,
    'min-height': 426,
    'disable-auto-hide-cursor': true,
    'dark-theme': true,
    'web-preferences': {
      'text-areas-are-resizable': false,
      'experimental-canvas-features': true,
      'subpixel-font-scaling': true,
      'overlay-scrollbars': false
    }
  });

  mainWindow.loadUrl('file://' + __dirname + '/../method-draw/editor/index.html');

  ipc.on('save-as', function(e, args) {
    var filePath = dialog.showSaveDialog(mainWindow, args.options);
    if (!filePath) return;

    fs.writeFile(filePath, args.data, function(err) {
      if (err != null) dialog.showErrorBox("Couldn't save File", err);
    });
  });

  ipc.on('open', function(e, args) {
    var filePath = dialog.showOpenDialog(mainWindow, args.options);
    if (filePath && filePath[0])
      e.returnValue = fs.readFileSync(filePath[0], { encoding: 'utf-8'});
  });

  ipc.on('import', function(e, args) {
    var filePath = dialog.showOpenDialog(mainWindow, args.options);
    if (filePath && filePath[0]) {
      fs.readFile(filePath[0], function(err, data){
        var type = mime.lookup(filePath[0]);
        if (type.indexOf('svg') != -1)
          e.returnValue = {data: data, type: type};
        else
          e.returnValue = {data: data.toString('base64'), type: type};
      });
    }
  });


  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
});
