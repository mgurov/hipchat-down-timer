var chai = require('chai');
chai.use(require('chai-datetime'));
var assert = require('chai').assert;

var parser = require('./cmdParser.js');

describe('Timer command parsing', function() {

  it('command without any parameter', function() {
    var actual = parser.extractKVs("/timer command");
    assert.deepEqual({text: 'command'}, actual);
  });

  it('unknown params ignored', function() {
    var actual = parser.extractKVs("/timer blah=fooe command fooe=blah");
    assert.deepEqual({text: 'blah=fooe command fooe=blah'}, actual);
  });

  it('at=14:24', function() {
    var actual = parser.extractKVs("/timer at=14:24 command");
    assert.deepEqual({text: 'command', at: '14:24'}, actual);
  });

  it('in=15m', function() {
    var actual = parser.extractKVs("/timer in=15m command");
    assert.deepEqual({text: 'command', in: '15m'}, actual);
  });
  
  it('ending command', function() {
    var actual = parser.extractKVs("/timer command in=15m");
    assert.deepEqual({text: 'command', in: '15m'}, actual);
  });
 
  it('/timer a in=on ooh at=at', function() {
    var actual = parser.extractKVs("/timer a in=on ooh at=at");
    assert.deepEqual({text: 'a ooh', in: 'on', 'at': 'at'}, actual);
  });
});

describe('command parsing e2e', function() {
  parser.timeService = function() {return new Date(Date.UTC(2006, 01, 02, 3, 4, 5, 6));}

  it('missing delay should yield an error', function() {
    var actual = parser.parseTimerCommand("sample text");
    assert.isNotNull(actual.error);
    assert.isUndefined(actual.executionTime);
  });

  it('explict delay in mins', function() {
    var actual = parser.parseTimerCommand("sample text in=7m");
    var expectedExecution = new Date(Date.UTC(2006, 01, 02, 3, 4 + 7, 5, 6));
    assert.equalTime(actual.executionTime, expectedExecution);
  });

  it('delay implies minute', function() {
    var actual = parser.parseTimerCommand("sample text in=7");
    var expectedExecution = new Date(Date.UTC(2006, 01, 02, 3, 4 + 7, 5, 6));
    assert.equalTime(actual.executionTime, expectedExecution);
  });

  it('non-numeric delay rejected', function() {
    var actual = parser.parseTimerCommand("sample text in=blah");
    assert.equal(actual.error, 'Unknown delay format \"blah\"');
    assert.notInclude(actual.text);
  });

  it('understands local time', function() {
    var actual = parser.parseTimerCommand("sample text at=8:06").executionTime;
    assert.deepEqual({h: 8, m: 6}, {h: actual.getHours(), m: actual.getMinutes()});
  });

  it('local time before now means tomorrow', function() {
    var actual = parser.parseTimerCommand("sample text at=2:04").executionTime;
    assert.deepEqual({h: 2, m: 4}, {h: actual.getHours(), m: actual.getMinutes()});
  });

  it('on is at', function() {
    var actual = parser.parseTimerCommand("sample text on=8:06").executionTime;
    assert.deepEqual({h: 8, m: 6}, {h: actual.getHours(), m: actual.getMinutes()});
  });

  it('understands local time with leading zero', function() {
    var actual = parser.parseTimerCommand("sample text at=08:06").executionTime;
    assert.deepEqual({h: 8, m: 6}, {h: actual.getHours(), m: actual.getMinutes()});
  });

  it('understands local time with leading one', function() {
    var actual = parser.parseTimerCommand("sample text at=18:06").executionTime;
    assert.deepEqual({h: 18, m: 6}, {h: actual.getHours(), m: actual.getMinutes()});
  });

});
