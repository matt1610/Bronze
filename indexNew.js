console.log('Bronze App');
var express = require('express');
var app = express();
var http = require('http').Server(app);

var Firebase = require("firebase");

var fs = require('fs');
var util = require("util");
var path = require('path');

var RaspiCam = require("raspicam");

var myFirebaseRef = new Firebase("https://bronzecam.firebaseio.com/");

var ON = false;
var DELAY;
var STREAMING;
var WIDTH;
var HEIGHT;

myFirebaseRef.child('settings').on('value', function(snapshot) {

  ON = snapshot.val().on;
  console.log('ON ' + ON);

  DELAY = parseInt(snapshot.val().delay);
  console.log('DELAY: ' + DELAY);

  WIDTH = snapshot.val().width.toString();
  HEIGHT = snapshot.val().height.toString();

  if (ON == true) {
    startStreaming(io);
  };

  if (!ON) {

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


 
function Start() {

    myFirebaseRef.child('img').set(dataUri, function(error) {
        if (error) {
          console.log(error);
        } else{
          console.log('Image Uploaded');
        }
    });

    myFirebaseRef.child('date').set(new Date());

  });
 
}
















