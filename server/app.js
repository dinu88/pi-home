var passport = require('passport'),
    express = require('express'),
    bodyParser = require('body-parser'),
    LocalStrategy = require('passport-local').Strategy,
    cookieParser = require('cookie-parser'),
    path = require('path'),
    Account = require('./models/account'),
    winston = require('winston'),
    lessMiddleware = require('less-middleware'),
    jadeStatic = require('jade-static'),
    config = require('./config_' + (process.env.ENV || 'dev') + '.js'),
    flash = require('connect-flash'),
    app = express(),
    net = require('net');


//config logger
var logger = new (winston.Logger)({
  exitOnError: false, //don't crash on exception
  transports: [
    new (winston.transports.Console)({level:'debug',handleExceptions: true,prettyPrint: true,silent:false,timestamp: true,colorize: true,json: false}),
    new (winston.transports.File)({ filename: 'common.log',name:'file.all',level:'debug',maxsize: 1024000,maxFiles: 10, handleExceptions: true,json: false}),
    new (winston.transports.File)({ filename: 'error.log',name:'file.error',level:'error',maxsize: 1024000,maxFiles: 10, handleExceptions: true,json: false})
  ]
});


// main config
app.set('port', config.app.PORT || 3034);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(flash());
app.use(require('express-session')({
  secret: 'pi-home-bad-secret',
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));
app.use(lessMiddleware(path.join(__dirname, 'source', 'less'), {
  dest: path.join(__dirname, '/public')
}));
app.use('/partials/', jadeStatic(__dirname + "/views/partials"));
app.use('/static', express.static(__dirname + '/public'));
app.use('/styles', express.static(__dirname + '/public/styles'));
app.use('/images', express.static(__dirname + '/public/images'));
app.use('/fonts', express.static(__dirname + '/public/fonts'));

//Passport configuration
var account = new Account(passport);

passport.use(new LocalStrategy(account.authenticate));
passport.serializeUser(account.serializeUser);
passport.deserializeUser(account.deserializeUser);


//TODO: Works only with one connection;
var netServer = net.createServer(function(netConnection) { //'connection' listener
  console.log('client connected');

  //require routes
  require('./routes')(app, passport, account, config, logger, netConnection);


  netConnection.on('end', function() {
    console.log('client disconnected');
  });
  //netConnection.write('hello\r\n');
  netConnection.pipe(netConnection);
});

app.listen(app.get('port'), function(){
  console.log(("Express server listening on port " + app.get('port')));
});


netServer.listen(config.app.NET_PORT, function() { //'listening' listener
  console.log(("NET server listening on port " + config.app.NET_PORT));
  console.log("Waiting client to connect...")
});