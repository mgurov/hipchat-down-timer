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

  it('by default 5 mins', function() {
    var actual = parser.parseTimerCommand("sample text");
    var expectedExecution = new Date(Date.UTC(2006, 01, 02, 3, 4 + 5, 5, 6));
    assert.equalTime(actual.executionTime, expectedExecution);
    assert.include(actual.notes, 'default delay 5m')
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


});
