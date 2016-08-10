var Repository = require('../lib/repository.js');

var timers = {}; //id -> handle

function setTimerTimeout(idAndTimestamp) {
  var id = idAndTimestamp.id;
  var timestamp = idAndTimestamp.timestamp; 
  if (timers[id]) {
    console.log('Skipping already existing', id);
    return;
  }
  setTimeout(
    function() {
      Repository.requestProcessing(id);
      delete timers[id];
    },
    timestamp - new Date().getTime()
  );
}

Repository.onNewTimer(setTimerTimeout);

console.log('About to log persisted timers')

Repository.loadPersistedTimers().then(function(timers) {
  console.log('Got persisted timers', timers);
  timers.forEach(setTimerTimeout);
}, console.error);