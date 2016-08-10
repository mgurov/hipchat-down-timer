var interval = setInterval(onInterval, 1000);

var count = 0;

function onInterval() {
  console.log('interval',  ++ count,  'at', new Date());
}