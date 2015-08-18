var bodyParser = require('body-parser')
  , express = require('express')
  , fs = require('fs')
  , lessCSS = require('less-middleware')
  , morgan = require('morgan')
  , path = require('path');


// define routes

var index = require('./routes/index')

var app = express();
if(process.env.NODE_ENV !== 'production') {
  require(path.join(process.cwd(),
                    '/lib/secrets'));
}
require(path.join(process.cwd(),
                  '/lib/mongodb'));


// middlewares

app.set('view engine', 'ejs');
app.set('case sensitive routing', true);


app.locals.title = 'minitwit';

app.use(lessCSS('www'));

var logStream = fs.createWriteStream(
  'access.log',
  {flags:'a'});
app.use(morgan('combined', {stream:logStream}));
app.use(morgan('dev'));

app.use(bodyParser.urlencoded({
  extended : true,
  type     : '*/x-www-form-urlencoded'
}));


// connect routes

app.use('/', index);


// handle errors

app.use(function(req,res,next) {
  res.status(403).send('Unauthorized');
});

app.use(function(err,req,res,next) {
  var log = require(path.join(process.cwd(),
                              '/lib/log'));
  // server errors will go to this file
  var errStream = fs.createWriteStream( 'errors.log',
                                      { flags:'a' });
  errStream.write(
    log.printNoColors(req,res)+'\n'+
    err+'\n'+
    err.stack+'\n');

  res.status(500).send('Server Error');
});

var port = process.env.PORT || 3000;
var server = app.listen(port, function() {
  var host = server.address().address;
  var port = server.address().port;
  console.log('App: I\'m listening');
  console.log('@ http://localhost:3000');
});
