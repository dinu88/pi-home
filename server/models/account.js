var MongoClient = require('mongodb').MongoClient,
    config = require('../config_' + (process.env.ENV || 'dev') + '.js'),
    crypto = require('crypto');

var DB = MongoClient.connect(config.mongo.host, function(err, db) {
  if (err) {
    console.log(err.message)
  } else {
    console.log("Connected to mongoDB.");
    DB = db;
  }
});

var findUser = function (username, fn) {
  var cursor = DB.collection('users').find({username: username}).toArray(function (err, user) {
    "use strict";
    if (err) {
      console.log(err);
    } else {
      if (user['0']) {
        fn(user['0']);
      } else {
        fn(null);
      }
    }
  });
};

var hash = function (pass, salt) {
  var h = crypto.createHash('sha512');

  h.update(salt + pass);
  //h.update(salt);

  return h.digest('hex');
};

var Account = function() {
  "use strict";

  this.serializeUser = function(user, done) {
    done(null, user);
  };

  this.deserializeUser = function(user, done) {
    done(null, user);
  };

  this.isAuthenticated = function (req, res, next) {

    if (req.user) {
      return next();
    }
    else {
      res.redirect('/login?r=' + req.path.substr(1));
    }

  };

  this.authenticate = function(username, password, done) {

    //DEV
    if (username == config.defaultUser.name && password == config.defaultUser.password) {
      var user = {
        'username': config.defaultUser.name
      };
      done(null, user);
    } else {
      console.log(username);
      findUser(username, function (user) {
        "use strict";
        console.log(user);
        if (user) {
          var pass = user.password;
          var salt = pass.split('|')[0];
          pass = pass.split('|')[1];

          if (hash(password, salt) == pass) {
            done(null, user);
          } else {
            done(null, false);
          }

        } else {
          done(null, false);
        }
      });

    }
  };

};

module.exports = Account;