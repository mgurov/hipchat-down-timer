module.exports.parseTimerCommand = function(inputString) {
  var withKvs = module.exports.extractKVs(inputString);
  withKvs.executionTime = module.exports.timeService();

  if (withKvs.in) {
    var match = withKvs.in.match(/(\d+)(m)?/)
    if (match) {
      var minutesToAdd = parseInt(match[0], 10);
      withKvs.executionTime.setMinutes(withKvs.executionTime.getMinutes() + minutesToAdd);
    } else {
      withKvs.text = ""
      withKvs.error = "Unknown delay format \"" + withKvs.in + "\"";
      withKvs.notes = ["Could not parse input \"" + inputString + "\"" ];  
    }    
  } else {
    withKvs.executionTime.setMinutes(withKvs.executionTime.getMinutes() + 5);
    withKvs.notes = ['default delay 5m'];
  }

  return withKvs;
};

module.exports.extractKVs = function extractKVs(inputString) {

  var fullCommand = inputString.replace(/^\/timer /, '');

  var collectedPairs = {};
  collectedPairs.text = fullCommand.replace(/(\S*)=(\S*)\s*/g, function(match, key, value) {
    if ("at" === key || "in" === key) {
      collectedPairs[key] = value;
      return "";
    } else {
      return match;
    }
  }).trim();
  return collectedPairs;
};

module.exports.timeService = function() {return new Date();};