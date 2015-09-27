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
    //TODO;
  };

};

module.exports = Account;