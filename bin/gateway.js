#!/usr/bin/env node

var numCPUs = require('os').cpus().length
  , amino = require('amino')
    .argv({
      p: {alias: 'port'},
      s: {alias: 'service'},
      t: {alias: 'threads', default: numCPUs},
      v: {alias: 'version'}
    })
    .conf('/etc/amino/gateway.json')
    .conf('../etc/gateway.json', __dirname)
  , port = amino.get('port')
  , threads = amino.get('threads')
  , service = amino.get('service')
  , gateway = require('../')
  , cluster = require('cluster')
  ;

if (amino.get('v')) {
  console.log(require(require('path').join(__dirname, '../package.json')).version);
  process.exit();
}

if (cluster.isMaster) {
  // Fork workers.
  for (var i = 0; i < threads; i++) {
    cluster.fork();
  }

  cluster.on('exit', function(worker, code, signal) {
    var exitCode = worker.process.exitCode;
    console.log('worker ' + worker.pid + ' died (' + exitCode + '). restarting...');
    cluster.fork();
  });

  console.log(service + ' gateway listening (' + (threads > 1 ? threads + ' threads' : 'single thread') + ') on port ' + port + '...');
} else {
  gateway.createGateway(service)
    .on('error', function(err) {
      console.error(err, 'bouncy error');
    })
    .listen(port);
}