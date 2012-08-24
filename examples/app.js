// Start one or more of these servers, and start the gateway.
// The gateway will load-balance between servers, with the default configuration.

var amino = require('amino').init();

var server = require('http').createServer(function (req, res) {
  res.end('hello world! sincerely, ' + service.spec + '\n');
});
var service = amino.createService('app', server);
service.on('listening', function () {
  console.log('app started: ' + service.spec);
});
