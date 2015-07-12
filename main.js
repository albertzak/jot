var app = require('app');
var BrowserWindow = require('browser-window');

require('crash-reporter').start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.
var mainWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OSX it is common for applications and their menu bar 
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform != 'darwin') {
    app.quit();
  }
});

app.on('ready', function() {
  mainWindow = new BrowserWindow({
    'width': 800,
    'height': 600,
    'disable-auto-hide-cursor': true,
    'web-preferences': {
      'text-areas-are-resizable': false,
      'experimental-canvas-features': true,
      'subpixel-font-scaling': true,
      'overlay-scrollbars': false
    }
  });

  mainWindow.loadUrl('file://' + __dirname + '/lib/static/index.html');

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
});
