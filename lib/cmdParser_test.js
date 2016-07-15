var assert = require('chai').assert;

function parseTimerCommand(inputString) {

  var fullCommand = inputString.replace(/^\/timer /, '');

  var collectedPairs = {};
  collectedPairs.text = fullCommand.replace(/(\S*)=(\S*)/, function(match, key, value) {
    if ("at" === key) {
      collectedPairs[key] = value;
      return "";
    } else {
      return match;
    }
  }).trim();
  return collectedPairs;
}

describe('Timer command parsing', function() {

  it('command without any parameter', function() {
    var actual = parseTimerCommand("/timer command");
    assert.deepEqual({text: 'command'}, actual);
  });

  it('unknown params ignored', function() {
    var actual = parseTimerCommand("/timer blah=fooe command fooe=blah");
    assert.deepEqual({text: 'blah=fooe command fooe=blah'}, actual);
  });


  it('at=14:24', function() {
    var actual = parseTimerCommand("/timer at=14:24 command");
    assert.deepEqual({text: 'command', at: '14:24'}, actual);
  });
  
});