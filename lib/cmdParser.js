module.exports = function parseTimerCommand(inputString) {

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