var moment = require('moment-timezone');
var cmdParser = require('../lib/cmdParser.js');
var Repository = require('../lib/repository.js');


module.exports = function (hipchat) {

  function processCmd(cmd) {
    console.log(cmd);

    if (cmd.error) {
      return hipchat.sendMessage(req.clientInfo, req.identity.roomId, cmd.error, { format: 'text', color: 'red', notify: false });
    } else {
      var timerText = cmd.text;

      return Repository.persistTimer(
        {
          args: [req.clientInfo, req.identity.roomId, timerText, { format: 'text', color: 'green', notify: true }],
          timestamp: cmd.executionTime.getTime()
        }
      ).then(function () { console.log('returning ok'); return null; }, function (err) { console.log('returning err'); return err; })
        .then(
        function (err) {
          //TODO err callback and response
          var text = !!err ? "Error" : "OK " + moment(cmd.executionTime).tz('Europe/Amsterdam').format('HH:mm');
          var color = !!err ? "red" : "green";
          return hipchat.sendMessage(req.clientInfo, req.identity.roomId, text, { format: 'text', color: color, notify: false });
        });
    }
  }

  return function handler(req, res) {
    var cmd = cmdParser.parseTimerCommand(req.body.item.message.message);
    processCmd(cmd)
      .then(function () { res.sendStatus(200); });
  }
} 