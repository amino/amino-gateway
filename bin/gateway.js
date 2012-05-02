#!/usr/bin/env node

var path = require('path'), nconf = require('nconf');
nconf.env().argv({
  port: {alias: 'p'}
});
nconf.file({file: path.join(__dirname, '../etc/gateway.conf')});
var confPath = nconf.get('conf');
if (confPath) {
  if (confPath[0] !== '/') {
    confPath = path.join(process.cwd(), confPath);
  }
  nconf.file({file: confPath});
}

var service = nconf.get('service')
  , amino = require('amino')
    .use(require('amino-request-http'))
    .use(require('amino-pubsub-redis', nconf.get('redis:port'), nconf.get('redis:host'), nconf.get('redis')))
  , gateway = require('../')
  ;

if (nconf.get('debug')) {
  amino.set('debug');
}

gateway.createServer(amino, nconf.get('service')).listen(nconf.get('port'), function() {
  console.log(nconf.get('service') + ' gateway listening on port ' + nconf.get('port') + '...');
});