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

var ON = false;
var DELAY;
var STREAMING;

myFirebaseRef.child('settings').on('value', function(snapshot) {

  ON = snapshot.val().on;
  console.log('ON ' + ON);

  DELAY = parseInt(snapshot.val().delay);
  console.log('DELAY: ' + DELAY);

  if (ON == true) {
    startStreaming(io);
  };

  if (!ON) {
    CheckToStop();
  };

});
 
// ROUTING
app.use('/', express.static(path.join(__dirname, 'stream')));
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});
 
http.listen(3000, function() {
  console.log('listening on *:3000');
});
 
function CheckToStop() {
  if (!ON) {
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

  var args = ["-w", "900", "-h", "675", "-o", "./stream/image_stream.jpg", "-t", "999999999", "-tl", "30000"];
  proc = spawn('raspistill', args);
 
  console.log('Watching for changes...');
 
  app.set('watchingFile', true);
 
  fs.watchFile('./stream/image_stream.jpg', function(current, previous) {
    var dataUri = base64Image("./stream/image_stream.jpg");

    console.log('Watching'):

    CheckToStop();

    myFirebaseRef.child('img').set(dataUri, function(error) {
        if (error) {
          console.log(error);
        } else{
          console.log('Image Uploaded');
        }
    });

  }); // End watchFile
 
} // End Streaming Fn
















