console.log('Bronze App');
Log('Bronze App');
var express = require('express');
var app = express();
var http = require('http').Server(app);

var Firebase = require("firebase");

var fs = require('fs');
var util = require("util");
var path = require('path');
var mime = require('mime');

var RaspiCam = require("raspicam");

// ROUTING
app.use('/', express.static(path.join(__dirname, 'photo')));
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});
 
http.listen(3000, function() {
  console.log('listening on *:3000');
});

var camera = new RaspiCam({
    mode: "photo",
    output: "./photo/image.jpg",
    encoding: "jpg",
    timeout: 20000
});

var myFirebaseRef = new Firebase("https://bronzecam.firebaseio.com/");

var ON = false;
var DELAY;
var STREAMING;
var WIDTH;
var HEIGHT;

// myFirebaseRef.child('settings').on('value', function(snapshot) {

//   ON = snapshot.val().on;
//   console.log('ON ' + ON);

//   DELAY = parseInt(snapshot.val().delay);
//   console.log('DELAY: ' + DELAY);

//   WIDTH = snapshot.val().width.toString();
//   HEIGHT = snapshot.val().height.toString();

//   if (ON == true) {
//     // startStreaming(io);
//   };

//   if (!ON) {

//   };

// });

camera.start();

camera.on("started", function( err, timestamp ){
  console.log("photo started at " + timestamp );
  Log('Started');
});

camera.on("read", function( err, timestamp, filename ){
  if (err) {
    Log(err);
  };
  Log('Read');
  console.log("photo image captured with filename: " + filename );
  var dataUri = base64Image("./photo/image.jpg");
  Send(dataUri);
  camera.stop();
  Log('Stopped');
});

camera.on("exit", function( timestamp ){
  console.log("photo child process has exited at " + timestamp );
});





 

function Log(msg) {
  var d = new Date();
  myFirebaseRef.child('console').set(msg +' '+ d.toTimeString());
}

 
function Send(dataUri) {

    myFirebaseRef.child('img').set(dataUri, function(error) {
        if (error) {
          console.log(error);
        } else{
          console.log('Image Uploaded');
          camera.start();
        }
    });

    myFirebaseRef.child('date').set(new Date());
 
}




function base64Image(src) {
    var data = fs.readFileSync(src).toString("base64");
    return util.format("data:%s;base64,%s", mime.lookup(src), data);
}






