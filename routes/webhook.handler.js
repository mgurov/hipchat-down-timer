var moment = require('moment-timezone');
var cmdParser = require('../lib/cmdParser.js');
var Repository = require('../lib/repository.js');


module.exports = function (hipchat) {

  function processCmd(cmd, req) {
    console.log(cmd);

    if (cmd.error) {
      return hipchat.sendMessage(req.clientInfo, req.identity.roomId, cmd.error, { format: 'text', color: 'red', notify: false });
    } else {
      var timerText = cmd.text;

      return Repository.persistTimer(
        {
          args: [req.clientInfo, req.identity.roomId, timerText, { format: 'text', color: 'gray', notify: true }],
          timestamp: cmd.executionTime.getTime()
        }
      ).then(null, function (err) { return {err: err}; })
        .then(
        function (result) {
          //TODO err callback and response
          var text = !!result.err ? "Error" : "OK " + formatExecutionTime(cmd.executionTime);
          var color = !!result.err ? "red" : "green";
          return hipchat.sendMessage(req.clientInfo, req.identity.roomId, text, { format: 'text', color: color, notify: false });
        });
    }
  }

  function logError(marker) {
    return function(error) {
      console.error(marker, error);
    }
  }

  function formatExecutionTime(executionTime) {
    return  moment(executionTime).tz('Europe/Amsterdam').format('HH:mm');
  }

  return function handler(req) {
    var message = req.body.item.message.message;
    console.log(message);
    if ("/timer:list" === message) {
      console.log('request listing');
      Repository.fetchRoomTimers(req.identity.roomId).then(
        function(timers) {
          var message = timers.map(function(t) {return formatExecutionTime(t.timestamp);}).join('\n');
          hipchat.sendMessage(req.clientInfo, req.identity.roomId, message, { format: 'text', color: 'green', notify: false })
            .then(null, logError('ERR sending list of rooms'));
        },
        logError('ERR listing room timers')
      );
    } else {
      var cmd = cmdParser.parseTimerCommand(message);
      processCmd(cmd, req).then(null, logError('ERR processing command'));
    }
  }
} 