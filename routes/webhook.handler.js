var moment = require('moment-timezone');
var cmdParser = require('../lib/cmdParser.js');
var Repository = require('../lib/repository.js');


function done(res) {
  return function() {res.sendStatus(200);};
}

module.exports = function(hipchat) {

    return function handler(req, res) {
      var cmd = cmdParser.parseTimerCommand(req.body.item.message.message);
      
      console.log(cmd);

      if (cmd.error) {
        hipchat.sendMessage(req.clientInfo, req.identity.roomId, cmd.error, { format: 'text', color: 'red', notify: false })
        .then(done(res));
      } else {
        var timerText = cmd.text;

        Repository.persistTimer(
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

            hipchat.sendMessage(req.clientInfo, req.identity.roomId, text, { format: 'text', color: color, notify: false })
              .then(done(res));
          }, function (err) {
            var text = !!err ? "Error" : "OK " + moment(cmd.executionTime).tz('Europe/Amsterdam').format('HH:mm');
            var color = !!err ? "red" : "green";

            hipchat.sendMessage(req.clientInfo, req.identity.roomId, text, { format: 'text', color: color, notify: false })
              .then(done(res));
          }

          );
      }
    }


} 