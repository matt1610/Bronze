console.log('Bronze App');
var express = require('express');
var app = express();
var webHttp = require('http');
var http = require('http').Server(app);
var cors = require('cors');
var exec = require('child_process').exec;
var os = require('os');
var ifaces = os.networkInterfaces();

var minute = 60000;

var Firebase = require("firebase");

var fs = require('fs');
var util = require("util");
var path = require('path');
var mime = require('mime');

var RaspiCam = require("raspicam");
var imageURI = false;
var IP = '';

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
app.use('/public', express.static(path.join(__dirname, 'public')));
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/viewphoto', function(req, res) {
  res.sendFile(__dirname + '/cam.html');
});

app.get('/restart', function (req,res) {
  // var temp = new Buffer(req.query.key).toString('base64');
  // if (temp == 'c2F5Y2hlZXNl') {
    exec('echo -e "'+req.query.key+'" | sudo -S reboot', function (res) {
      console.log(res);
    });
    res.json({success : true});
  // } else{
  //   res.json({success : false});
  // }
});

app.get('/takenewpic', function (req, res) {
  var temp = new Buffer(req.query.key).toString('base64');
  if (temp == 'c2F5Y2hlZXNl') {
    camera.stop();
    camera.start();
    res.json({success : true});
  } else{
    res.json({success : false});
  }
});

app.get('/pi', function(req, res) {
  res.send('Raspberry Pi!');
});

app.get('/showimage', function( req, res ) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end('<html><head><title>Image</title></head><body><img src="'+imageURI+'"/></body></html>');
});

app.get('/image', function( req, res ) {
    var d = new Date();
    d.setHours(d.getHours()+2);

    if (imageURI) {
      res.json({image:imageURI, success:true, date : d});
    } else{
      res.json({success : false, message : 'Hang on there billy, the cam is still firing up, try again in a few moments.'});
    }
});

app.get('/takevideo', function (req, res) {
    camera.stop();

    var video = new RaspiCam({
        mode: 'video',
        output: './video/video.h264',
        framerate: 15,
        bitrate : 500000,
        timeout: 5000,
        verbose : true
    });

    video.start();
    video.on('read', function(err, timestamp, filename) {
        //exec('ffmpeg -r 30 -i file.h264 -vcodec copy outputfile.mp4');
        exec('ffmpeg -r 15 -i ' + filename + ' -vcodec copy public/outputfile.mp4', function(err, stdout, stderror) {
            // console.log('stdout: ' + stdout);
            // console.log('stderr: ' + stderr);
            console.log('Converting');
            if (err !== null) {
                console.log('exec error: ' + err);
            } else {
                //success
                res.json({ success: true, videoUrl: 'public/outputfile.mp4' });
            }
            camera.start();
        });
    });

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
  d.setHours(d.getHours()+2);
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

    var d = new Date();
    d.setHours(d.getHours()+2);

    myFirebaseRef.child('date').set(d);
    myFirebaseRef.child('IP').set(IP);
 
}

function base64Image(src) {
    var data = fs.readFileSync(src).toString("base64");
    return util.format("data:%s;base64,%s", mime.lookup(src), data);
}

updateDns();
checkIp();
setInterval(function() {
  updateDns();
  checkIp();
},30 * minute);


function checkIp () {
  Object.keys(ifaces).forEach(function (ifname) {
    var alias = 0;

    ifaces[ifname].forEach(function (iface) {
      if ('IPv4' !== iface.family || iface.internal !== false) {
        // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
        return;
      }

      if (alias >= 1) {
        // this single interface has multiple ipv4 addresses
        console.log(ifname + ':' + alias, iface.address);
      } else {
        // this interface has only one ipv4 adress
        console.log(ifname, iface.address);
      }
      ++alias;

      // if (iface.address != '') {
      //   exec('reboot -r now', function (res) {
      //     console.log(res);
      //   });
      // };

      IP = iface.address;

    });
  });
}

function updateDns() {

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




