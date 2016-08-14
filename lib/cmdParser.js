var moment = require('moment-timezone');

module.exports.parseTimerCommand = function(inputString) {
  var withKvs = module.exports.extractKVs(inputString);
  var now = module.exports.timeService();

  if (withKvs.in) {
    var match = withKvs.in.match(/(\d+)(m)?/)
    if (match) {
      var minutesToAdd = parseInt(match[0], 10);
      now.setMinutes(now.getMinutes() + minutesToAdd);
      withKvs.executionTime = now;
    } else {
      withKvs.text = "";
      withKvs.error = "Unknown delay format \"" + withKvs.in + "\"";
      withKvs.notes = ["Could not parse input \"" + inputString + "\"" ];  
    }    
  } else if (withKvs.at || withKvs.on) {
    atInput = (withKvs.at || withKvs.on);
    var match  = atInput.match(/(\d{1,2}):(\d{1,2})/)
    if (match) {
      withKvs.notes = [];
      withKvs.executionTime = moment.tz(atInput, "hh:mm" , "Europe/Amsterdam").toDate();
      if (withKvs.executionTime.getTime() < new Date().getTime()) {
        withKvs.executionTime.setDate(withKvs.executionTime.getDate() + 1);
      }
    } else {
      withKvs.text = "";
      withKvs.error = "Unrecognized at string: " + atInput;
      withKvs.notes = ["Could not parse " + atInput + " within \"" + inputString + "\"" ];
    }
  } else {
    withKvs.text = "";
    withKvs.error = "But when? Use at=HH:mm or in=Xm to define the moment in time.";
    withKvs.notes = ["Could not parse"];
  }

  return withKvs;
};

module.exports.extractKVs = function extractKVs(inputString) {

  var fullCommand = inputString.replace(/^\/timer /, '');

  var collectedPairs = {};
  collectedPairs.text = fullCommand.replace(/(\S*)=(\S*)\s*/g, function(match, key, value) {
    if ("at" === key || "in" === key || "on" === key) {
      collectedPairs[key] = value;
      return "";
    } else {
      return match;
    }
  }).trim();
  return collectedPairs;
};

module.exports.timeService = function() {return new Date();};