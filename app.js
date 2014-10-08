var express = require('express');
var sys = require('sys');
var AWS = require('aws-sdk');

AWS.config.loadFromPath('./config.json');

var s3 = new AWS.S3();

console.log("Initializing for bucket: " + AWS.config.bucket);

var app = express();
app.set('views', './views')
app.set('view engine', 'jade')

app.get('/', function(req, res) {
  s3.listObjects({Bucket: AWS.config.bucket}, function(err, data) {
    if (err) res.send("S3 error");
    else {
      res.render('index', data);
    }
  });
});

var server = app.listen(3000, function() {
  console.log('listening on port %d', server.address().port);
});

