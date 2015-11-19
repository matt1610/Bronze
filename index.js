console.log('Bronze App');
var express = require('express');
var app = express();
var webHttp = require('http');
var http = require('http').Server(app);
var cors = require('cors');

var minute = 60000;

var Firebase = require("firebase");

var fs = require('fs');
var util = require("util");
var path = require('path');
var mime = require('mime');

var RaspiCam = require("raspicam");
var imageURI;

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    if ('OPTIONS' == req.method) {
      res.send(200);
    }
    else {
      next();
    }
};

app.use(cors());
app.use(allowCrossDomain);

// ROUTING
app.use('/', express.static(path.join(__dirname, 'photo')));
app.use('/', express.static(path.join(__dirname, 'js')));
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/viewphoto', function(req, res) {
  res.sendFile(__dirname + '/cam.html');
});

app.get('/pi', function(req, res) {
  res.send('Raspberry Pi!');
});

app.get('/image', function( req, res ) {
  res.json({image:imageURI, success:true, date : new Date()});
});
 
http.listen(6823, function() {
  console.log('listening on *:6823');
});

var camera = new RaspiCam({
    mode: "photo",
    output: "./photo/image.jpg",
    encoding: "jpg",
    timeout: 120000,
    width: 600,
    height: 450
  });

var myFirebaseRef = new Firebase("https://bronzecam.firebaseio.com/");

var ON = false;
var DELAY;
var STREAMING;
var WIDTH;
var HEIGHT;

myFirebaseRef.child('settings').on('value', function(snapshot) {

  ON = snapshot.val().on;
  DELAY = parseInt(snapshot.val().delay);

  WIDTH = snapshot.val().width.toString();
  HEIGHT = snapshot.val().height.toString();

  camera.set('width', WIDTH);
  camera.set('height', HEIGHT);

  if (ON) {
    Begin();
    camera.start();
  } else {
    camera.stop();
  }

});

function Begin() {
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
    imageURI = dataUri;
    Send(dataUri);

    if (ON) {
      camera.stop();
    }

    Log('Stopped');
  });

  camera.on("exit", function( timestamp ){
    console.log("photo child process has exited at " + timestamp );
  });
}
 

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
          if (ON) {
            camera.start();
          }
        }
    });

    myFirebaseRef.child('date').set(new Date());
 
}

function base64Image(src) {
    var data = fs.readFileSync(src).toString("base64");
    return util.format("data:%s;base64,%s", mime.lookup(src), data);
}

getTestPersonaLoginCredentials();
setInterval(function() {
  getTestPersonaLoginCredentials();
},30 * minute);


function getTestPersonaLoginCredentials() {

    return webHttp.get({
        host: 'freedns.afraid.org',
        path: '/dynamic/update.php?T0E5WTl5eDZ1NWJJSjNhSm1SUGxaeGJ5OjE1Mjc5MjA1'
    }, function(response, err) {
        // Continuously update stream with data
        if (err) {
          // console.log(err);
        };
        var body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {
            // Data reception is done, do whatever with it!
            // var parsed = JSON.parse(body);
            console.log(body);
        });
    });

}




