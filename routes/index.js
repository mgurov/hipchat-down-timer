var http = require('request');
var cors = require('cors');
var uuid = require('uuid');
var url = require('url');
var cmdParser = require('../lib/cmdParser.js');
var moment = require('moment-timezone');
var status = {
  startup: new Date()
};

var REDIS_ZLIST = 'down-timer-queue';

var redis = require("redis"),
  redis_client = redis.createClient(process.env.DATABASE_URL);

redis_client.on("error", function (err) {
  console.error("Redis client error " + err);
});

// This is the heart of your HipChat Connect add-on. For more information,
// take a look at https://developer.atlassian.com/hipchat/tutorials/getting-started-with-atlassian-connect-express-node-js
module.exports = function (app, addon) {
  var hipchat = require('../lib/hipchat')(addon);

  function queueMessage(command, callback) {

    function onQueued(err) {
      if (err) {
        callback(err);
      } else {
        setTimeout(function () {
          console.log('executing a timeout', hipchat.sendMessage, command.args);
          var promise = hipchat.sendMessage.apply(hipchat, command.args).then(function () { console.log('message sent OK'); }, function(){ console.log('ERR sending message', arguments); });
          console.log('executed a timeout', promise);
        }, command.timestamp - new Date().getTime());
        console.log('setting a timeout');
        callback(null);
      }
    }

    if (!!command.fromQueue) {
      redis_client.zadd(REDIS_ZLIST, command.timestamp, JSON.stringify(command.args), onQueued);
    } else {
      onQueued(null);
    }
  }


  redis_client.zrange(REDIS_ZLIST, 0, -1, function (err, result) {
    if (err) {
      console.error('Error fetching redis list' + err);
      return;
    }

    result.forEach(function(resultEntry){
      queueMessage(JSON.parse(resultEntry), function() {})
    });

  });


  // simple healthcheck
  app.get('/healthcheck', function (req, res) {
    res.send('OK');
  });

  app.get('/status', function (req, res) {
    res.json(status);
  });

  // Root route. This route will serve the `addon.json` unless a homepage URL is
  // specified in `addon.json`.
  app.get('/',
    function (req, res) {
      // Use content-type negotiation to choose the best way to respond
      res.format({
        // If the request content-type is text-html, it will decide which to serve up
        'text/html': function () {
          var homepage = url.parse(addon.descriptor.links.homepage);
          if (homepage.hostname === req.hostname && homepage.path === req.path) {
            res.render('homepage', addon.descriptor);
          } else {
            res.redirect(addon.descriptor.links.homepage);
          }
        },
        // This logic is here to make sure that the `addon.json` is always
        // served up when requested by the host
        'application/json': function () {
          res.redirect('/atlassian-connect.json');
        }
      });
    }
  );

  // This is an example route that's used by the default for the configuration page
  // https://developer.atlassian.com/hipchat/guide/configuration-page
  app.get('/config',
    // Authenticates the request using the JWT token in the request
    addon.authenticate(),
    function (req, res) {
      // The `addon.authenticate()` middleware populates the following:
      // * req.clientInfo: useful information about the add-on client such as the
      //   clientKey, oauth info, and HipChat account info
      // * req.context: contains the context data accompanying the request like
      //   the roomId
      res.render('config', req.context);
    }
  );

  // This is an example glance that shows in the sidebar
  // https://developer.atlassian.com/hipchat/guide/glances
  app.get('/glance',
    cors(),
    addon.authenticate(),
    function (req, res) {
      res.json({
        "label": {
          "type": "html",
          "value": "Hello World!"
        },
        "status": {
          "type": "lozenge",
          "value": {
            "label": "NEW",
            "type": "error"
          }
        }
      });
    }
  );

  // This is an example end-point that you can POST to to update the glance info
  // Room update API: https://www.hipchat.com/docs/apiv2/method/room_addon_ui_update
  // Group update API: https://www.hipchat.com/docs/apiv2/method/addon_ui_update
  // User update API: https://www.hipchat.com/docs/apiv2/method/user_addon_ui_update
  app.post('/update_glance',
    cors(),
    addon.authenticate(),
    function (req, res) {
      res.json({
        "label": {
          "type": "html",
          "value": "Hello World!"
        },
        "status": {
          "type": "lozenge",
          "value": {
            "label": "All good",
            "type": "success"
          }
        }
      });
    }
  );

  // This is an example sidebar controller that can be launched when clicking on the glance.
  // https://developer.atlassian.com/hipchat/guide/dialog-and-sidebar-views/sidebar
  app.get('/sidebar',
    addon.authenticate(),
    function (req, res) {
      res.render('sidebar', {
        identity: req.identity
      });
    }
  );

  // This is an example dialog controller that can be launched when clicking on the glance.
  // https://developer.atlassian.com/hipchat/guide/dialog-and-sidebar-views/dialog
  app.get('/dialog',
    addon.authenticate(),
    function (req, res) {
      res.render('dialog', {
        identity: req.identity
      });
    }
  );

  // Sample endpoint to send a card notification back into the chat room
  // See https://developer.atlassian.com/hipchat/guide/sending-messages
  app.post('/send_notification',
    addon.authenticate(),
    function (req, res) {
      var card = {
        "style": "link",
        "url": "https://www.hipchat.com",
        "id": uuid.v4(),
        "title": req.body.messageTitle,
        "description": "Great teams use HipChat: Group and private chat, file sharing, and integrations",
        "icon": {
          "url": "https://hipchat-public-m5.atlassian.com/assets/img/hipchat/bookmark-icons/favicon-192x192.png"
        }
      };
      var msg = '<b>' + card.title + '</b>: ' + card.description;
      var opts = { 'options': { 'color': 'yellow' } };
      hipchat.sendMessage(req.clientInfo, req.identity.roomId, msg, opts, card);
      res.json({ status: "ok" });
    }
  );

  // This is an example route to handle an incoming webhook
  // https://developer.atlassian.com/hipchat/guide/webhooks
  app.post('/webhook',
    addon.authenticate(),
    function (req, res) {
      //console.log('webhook', req.body);
      //console.log('webhook cmd', req.body.item.message.message);
      var cmd = cmdParser.parseTimerCommand(req.body.item.message.message);

      console.log(cmd);

      if (cmd.error) {
        hipchat.sendMessage(req.clientInfo, req.identity.roomId, cmd.error, { format: 'text', color: 'red', notify: false });
      } else {
        var timerText = cmd.text;

        queueMessage(
          {
            args: [req.clientInfo, req.identity.roomId, timerText, { format: 'text', color: 'green', notify: true }],
            timestamp: cmd.executionTime.getTime(),
            fromQueue: false
          },

          function (err) {
            //TODO err callback and response
            var text = !!err ? "Error" : "OK " + moment(cmd.executionTime).tz('Europe/Amsterdam').format('HH:mm');
            var color = !!err ? "red" : "green";

            hipchat.sendMessage(req.clientInfo, req.identity.roomId, text, { format: 'text', color: color, notify: false })
              .then(function (data) {
                res.sendStatus(200);
              });
          }
        );
      }

    });

  // Notify the room that the add-on was installed. To learn more about
  // Connect's install flow, check out:
  // https://developer.atlassian.com/hipchat/guide/installation-flow
  addon.on('installed', function (clientKey, clientInfo, req) {
    hipchat.sendMessage(clientInfo, req.body.roomId, 'The ' + addon.descriptor.name + ' add-on has been installed in this room');
  });

  // Clean up clients when uninstalled
  addon.on('uninstalled', function (id) {
    addon.settings.client.keys(id + ':*', function (err, rep) {
      rep.forEach(function (k) {
        addon.logger.info('Removing key:', k);
        addon.settings.client.del(k);
      });
    });
  });

};
