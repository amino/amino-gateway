#!/usr/bin/env node

var amino = require('amino')
    .argv({'p': {alias: 'port'}})
    .conf('/etc/amino/gateway.json')
    .conf('../etc/gateway.json', __dirname)
  , port = amino.get('port')
  , service = amino.get('service')
  , gateway = require('../')
  ;

gateway.createServer(amino, service).listen(port, function() {
  console.log(service + ' gateway listening on port ' + port + '...');
});