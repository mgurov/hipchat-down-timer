
var Repository = require('../lib/repository.js');

module.exports.start = function (hipchat) {
  Repository.onProcessingRequest(function (command) {
    hipchat.sendMessage.apply(hipchat, command.args)
      .then(function () { console.log('message sent OK'); }, function () { console.log('ERR sending message', arguments); });
  });
}

function makeHipChat() {
  // This is the entry point for your add-on, creating and configuring
  // your add-on HTTP server

  // [Express](http://expressjs.com/) is your friend -- it's the underlying
  // web framework that `atlassian-connect-express` uses
  var express = require('express');
  var bodyParser = require('body-parser');
  var compression = require('compression');
  var errorHandler = require('errorhandler');
  var morgan = require('morgan');
  // You need to load `atlassian-connect-express` to use her godly powers
  var ac = require('atlassian-connect-express');
  process.env.PWD = process.env.PWD || process.cwd(); // Fix expiry on Windows :(
  // Static expiry middleware to help serve static resources efficiently
  // var expiry = require('static-expiry');
  // We use [Handlebars](http://handlebarsjs.com/) as our view engine
  // via [express-hbs](https://npmjs.org/package/express-hbs)
  var hbs = require('express-hbs');
  // We also need a few stock Node modules
  var http = require('http');
  var path = require('path');
  var os = require('os');

  // Let's use Redis to store our data
  ac.store.register('redis', require('atlassian-connect-express-redis'));

  // Anything in ./public is served up as static content
  var staticDir = path.join(__dirname, 'public');
  // Anything in ./views are HBS templates
  var viewsDir = __dirname + '/views';
  // Your routes live here; this is the C in MVC
  var routes = require('../routes');
  // Bootstrap Express
  var app = express();
  // Bootstrap the `atlassian-connect-express` library
  var addon = ac(app);
  // You can set this in `config.js`
  var port = addon.config.port();
  // Declares the environment to use in `config.js`
  var devEnv = app.get('env') == 'development';

  // Load the HipChat AC compat layer
  var ac_hipchat = require('atlassian-connect-express-hipchat')(addon, app);
  var hipchat = require('../lib/hipchat')(addon);


}