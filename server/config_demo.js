var config = {};

config.app = {};
config.app.PORT = 8013;
config.app.NET_PORT = 8014;

//MongoDB
config.mongo = {};
config.mongo.host = 'mongodb://localhost:27017/pi-home';

module.exports = config;