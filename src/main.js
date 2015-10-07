"use strict";

var app           = require('app');
var BrowserWindow = require('browser-window');
var ipc           = require('ipc');
var dialog        = require('dialog');
var fs            = require('fs');
var mime          = require('mime');
var temp          = require('temp');
var execSync      = require('child_process').execSync;

require('crash-reporter').start();
temp.track();

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
    x: display.x,
    y: display.y,
    width: display.width,
    height: display.height,
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

  mainWindow.maximize();

  mainWindow.loadUrl('file://' + __dirname + '/../method-draw/editor/index.html');

  var Jot = {
    setFile: function(path) {
      mainWindow.setRepresentedFilename(path);
      mainWindow.setTitle([path, 'Jot'].join(' - '));
      return Jot.lastFile = path;
    },
    getFile: function() {
      return mainWindow.getRepresentedFilename();
    },
    lastFile: '~/Documents/Untitled.svg',
    setDirty: function(bool) {
      mainWindow.setDocumentEdited(bool);
    },
    saveAs: function(args) {
      var options = {
        title: 'Save As',
        defaultPath: Jot.lastFile,
        filters: [
          { name: 'Scalable Vector Graphics', extensions: ['svg']}
        ]
      };

      var filePath = dialog.showSaveDialog(mainWindow, options);
      if (!filePath) return;
      Jot.setFile(filePath);
      Jot.setDirty(false);
      fs.writeFile(filePath, args.data, function(err) {
        if (err != null) dialog.showErrorBox("Couldn't save File", err);
      });
    },
    save: function(args) {
      if (!Jot.getFile())
        return Jot.saveAs(args);

      Jot.setDirty(false);
      fs.writeFile(Jot.getFile(), args.data, function(err) {
        if (err != null) dialog.showErrorBox("Couldn't save File", err);
      });
    },
  }

  ipc.on('save-as', function(e, args) {
    Jot.saveAs(args);
  });

  ipc.on('save', function(e, args) {
    Jot.save(args);
  });

  ipc.on('setDirty', function(e, bool) {
    Jot.setDirty(bool);
  });

  ipc.on('open', function(e, args) {
    var filePath = dialog.showOpenDialog(mainWindow, args.options);
    if (filePath && filePath[0]) {
      e.returnValue = fs.readFileSync(filePath[0], { encoding: 'utf-8'});
      Jot.setFile(filePath);
      Jot.setDirty(false);
    }
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

  ipc.on('export-pdf', function(e, args) {
    var outputFilePath = dialog.showSaveDialog(mainWindow, args.options);
    if (!outputFilePath) return;

    temp.open('jot', function(err, f) {
      fs.write(f.fd, args.data);
      fs.close(f.fd, function(err) {
        var svgFilePaths = [f.path];
        execSync('rsvg-convert -f pdf -o ' + outputFilePath + ' ' + svgFilePaths.join(' '));
      });
    });
  });

  mainWindow.on('close', function(e) {
    var close = !!dialog.showMessageBox(mainWindow, {
      type: 'warning',
      buttons: ['No, keep', 'Yes, close'],
      title: 'Warning',
      message: 'Do you really want to close this file?'
    });

    if (!close)
      e.preventDefault();
  });

  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
});
