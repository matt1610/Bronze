var express = require('express');
var app = express();
var http = require('http').Server(app);

var io = require('socket.io')(http);
var Firebase = require("firebase");

var fs = require('fs');
var util = require("util");
var path = require('path');
 
var spawn = require('child_process').spawn;
var mime = require('mime');
var proc;

var myFirebaseRef = new Firebase("https://bronzecam.firebaseio.com/");

var ON;
var DELAY;
var STREAMING;

myFirebaseRef.child('settings').on('value', function(snapshot) {

  ON = parseInt(snapshot.val().on);
  console.log('ON ' + ON);

  DELAY = parseInt(snapshot.val().delay);
  console.log('DELAY: ' + DELAY);

  if (ON > 0) {
    startStreaming(io);
  };

});
 
// ROUTING
app.use('/', express.static(path.join(__dirname, 'stream')));
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

// SOCKET LIST
var sockets = {};

// Start();
// SOCKET CONNECTION
io.on('connection', function(socket) {
 
  sockets[socket.id] = socket;
  console.log("Total clients connected : ", Object.keys(sockets).length);
 
  socket.on('disconnect', function() {
    delete sockets[socket.id];
 
    // no more sockets, kill the stream
    if (Object.keys(sockets).length == 0) {
      app.set('watchingFile', false);
      if (proc) proc.kill();
      fs.unwatchFile('./stream/image_stream.jpg');
    }
  });
 
  socket.on('start-stream', function() {
    startStreaming(io);
  });
 
});
 
http.listen(3000, function() {
  console.log('listening on *:3000');
});






 
function CheckToStop() {
  if (Object.keys(sockets).length == 0) {
    app.set('watchingFile', false);
    if (proc) proc.kill();
    fs.unwatchFile('./stream/image_stream.jpg');
    console.log('Stopped');
  }
}

// Get Data URI of Image
function base64Image(src) {
    var data = fs.readFileSync(src).toString("base64");
    return util.format("data:%s;base64,%s", mime.lookup(src), data);
}







 
function startStreaming(io) {
 
  if (app.get('watchingFile')) {
    io.sockets.emit('liveStream', 'image_stream.jpg?_t=' + (Math.random() * 100000));
    return;
  }
 
  // var freq = (5 * 1000).toString();
  var args = ["-w", "900", "-h", "675", "-o", "./stream/image_stream.jpg", "-t", "999999999", "-tl", "30000"];
  proc = spawn('raspistill', args);
 
  console.log('Watching for changes...');
 
  app.set('watchingFile', true);
 
  fs.watchFile('./stream/image_stream.jpg', function(current, previous) {
    io.sockets.emit('liveStream', 'image_stream.jpg?_t=' + (Math.random() * 100000));

    var dataUri = base64Image("./stream/image_stream.jpg");

    console.log('Done');

    CheckToStop();

    // myFirebaseRef.set({
    //   img : dataUri
    // });

  })
 
} // End Streaming Fn
















