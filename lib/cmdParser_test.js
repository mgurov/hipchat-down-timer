var assert = require('chai').assert;

function parseTimerCommand(inputString) {

  var re = /^\/timer /;
  return {text: inputString.replace(re, '')};
}

describe('Timer command parsing', function() {
  it('command without any parameter', function() {
    var actual = parseTimerCommand("/timer command");
    assert.deepEqual({text: 'command'}, actual);
  });
});