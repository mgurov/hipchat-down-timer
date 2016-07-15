var assert = require('chai').assert;

var parseTimerCommand = require('./cmdParser.js');

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

  it('in=15m', function() {
    var actual = parseTimerCommand("/timer in=15m command");
    assert.deepEqual({text: 'command', in: '15m'}, actual);
  });
  
  it('ending command', function() {
    var actual = parseTimerCommand("/timer command in=15m");
    assert.deepEqual({text: 'command', in: '15m'}, actual);
  });
 
  it('/timer a in=on ooh at=at', function() {
    var actual = parseTimerCommand("/timer a in=on ooh at=at");
    assert.deepEqual({text: 'a ooh', in: 'on', 'at': 'at'}, actual);
  });
  
});