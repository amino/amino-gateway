#!/usr/bin/env node

var argv = require('optimist')
    .alias('p', 'port')
    .alias('s', 'service')
    .alias('t', 'threads')
    .alias('v', 'version')
    .default('port', 8080)
    .default('service', 'app')
    .default('threads', require('os').cpus().length)
    .default('sockets', 25000)
    .argv
  , amino = require('amino')
    .use(require('../'), argv)
    .init({ redis: argv.redis, request: argv.request, service: false })
  , cluster = require('cluster')

if (argv.version) {
  console.log(require(require('path').join(__dirname, '../package.json')).version);
  process.exit();
}

if (cluster.isMaster) {
  // Fork workers.
  for (var i = 0; i < argv.threads; i++) {
    cluster.fork();
  }

  cluster.on('exit', function (worker, code, signal) {
    var exitCode = worker.process.exitCode;
    console.log('worker ' + worker.pid + ' died (' + exitCode + '). restarting...');
    cluster.fork();
  });

  console.log(argv.service + ' gateway listening (' + (argv.threads > 1 ? argv.threads + ' threads' : 'single thread') + ') on port ' + argv.port + '...');
}
else {
  amino.createGateway(argv)
    .on('error', function (err) {
      console.error(err, 'server error');
    })
    .listen(argv.port);
}