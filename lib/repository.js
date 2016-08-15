var REDIS_HASH = 'down-timer-s';
var PROCESSING_QUEUE = 'down-timer-processing_queue';
var NEW_TIMER_CHAN = 'down-timer-new';
var REDIS_ID_PREFIX = 'down-timer-';

var redis = require("redis");
var Promise = require('bluebird');
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

function newClient() {
  return redis.createClient(process.env.DATABASE_URL);
}

var redis_client = newClient();

function removeTimerPersistence(command) {
  return redis_client.hdelAsync(REDIS_HASH, command.persistedId);
}

redis_client.on("error", function (err) {
  console.error("Redis client error " + err);
});

function nextId() {
  return new Promise(function(resolve,reject){
    reject('something has failed');
  });
  //return redis_client.incrAsync("down-timer-seq");
}

function persistTimer(command) {
  return nextId().then(
    function (nextId) {
      command.id = nextId;
      console.log(nextId, 'persisting');
      var multi = redis_client.multi();
      multi.hset(REDIS_HASH, nextId, JSON.stringify(command));
      multi.publish(NEW_TIMER_CHAN, JSON.stringify({timestamp: command.timestamp, id: nextId}));
      console.log('about to publish');
      return multi.execAsync().then(
        function() {console.log('published ok', arguments); return 'ok';},
        function() {console.log('err published', arguments); return 'err';}
      );
    });
}

function onNewTimer(callback) {
  var sub = newClient();
  sub.on('message', function(chan, msg) {
    var message = JSON.parse(msg);
    console.log('notified', message);
    callback(message);
  });
  console.log('Subscribed for', NEW_TIMER_CHAN);
  sub.subscribe(NEW_TIMER_CHAN);
  return {
    unsubscribe: function() {
      sub.unsubscribe();
      sub.quit();
    }
  }
}

function loadPersistedTimers() {
  return redis_client.hvalsAsync(REDIS_HASH)
    .then(function (persistedTimers) {
      return persistedTimers.map(JSON.parse);
    });
}

function requestProcessing(timerId) {
  console.log('sending request for processing', timerId);
  return redis_client.rpush(PROCESSING_QUEUE, timerId);
}

function onProcessingRequest(processingCallback) {
  function callbackWrapper(error, pop) {
    var chan = pop[0];
    var timerId = pop[1];
    console.log('received request for processing ', timerId);
    var multi = redis_client.multi();
    multi.hget(REDIS_HASH, timerId);
    multi.hdel(REDIS_HASH, timerId);
    //TODO: make sure listening process doesn't stop here.
    multi.execAsync().then(
      function(responses) {
        console.log('Have to process', timerId, responses);
        var timerString = responses[0];
        if (!timerString) {
          console.log('Skipping processing already missing timer', timerId);
        } else {
          processingCallback(JSON.parse(timerString));
        }
        
        listen();
      }, function() {
        console.log('Ignoring already consumned (?) timer', timerId);
        listen(); //TODO: how to shortcut? 
      }
    )
  }
  var listenerClient = newClient();
  function listen() {
    console.log('waiting for processing request');
    listenerClient.blpop(PROCESSING_QUEUE, 0, callbackWrapper);
  }
  listen();
}

module.exports = {
  persistTimer: persistTimer,
  onNewTimer: onNewTimer,
  loadPersistedTimers: loadPersistedTimers,
  requestProcessing:requestProcessing,
  onProcessingRequest: onProcessingRequest 
};