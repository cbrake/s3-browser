var express = require('express');
var sys = require('sys');
var AWS = require('aws-sdk');
var config = require('./config.json');
var bodyParser = require('body-parser');
var session = require('express-session');

AWS.config.update(config, true);

var s3 = new AWS.S3();

console.log("Initializing for bucket: " + AWS.config.bucket);

var app = express();
app.set('views', './views')
app.set('view engine', 'jade')

app.use(bodyParser.urlencoded({extended:false}));
app.use(session({
  resave: false,
  saveUnitialized: false,
  secret: "this is a secret"
}));

function checkAuth(req, res, next) {
  if (!req.session.user_id) {
    res.redirect('/login');
  } else {
    next();
  }
}

app.get('/login', function(req, res) {
  console.log("/login");
  res.render('login', {message: null});
});

function checkUser(name, pass) {
  if (config.users[name] === pass)
    return true;
  else 
    return false;
}

app.post('/login', function (req, res) {
  var post = req.body;
  console.log(sys.inspect(post));
  if (checkUser(post.username, post.password)) {
    req.session.user_id = post.username;
    res.redirect('/');
  } else {
    res.send('Bad user/pass');
  }
});

app.get('/', checkAuth, function(req, res) {
  s3.listObjects({Bucket: AWS.config.bucket}, function(err, data) {
    if (err) res.send("S3 error");
    else {
      res.render('index', data);
    }
  });
});

app.get('/file/*', function(req, res) {
  console.log(req.params);

  function sendFile(req, res) {
    s3.getObject({Bucket: AWS.config.bucket, Key: req.params[0]}).createReadStream().pipe(res);  
  }

  if (req.query.user && config.users[req.query.user] === req.query.pass) {
    sendFile(req, res);
  } else {
    checkAuth(req, res, function(){
      sendFile(req, res);
    });
  }
});

var server = app.listen(3000, function() {
  console.log('listening on port %d', server.address().port);
});

