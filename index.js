var amino = require('amino')
  , cookie = require('cookie')
  , parseUrl = require('url').parse
  , httpProxy = require('http-proxy')
  , Agent = require('socket-agent')

module.exports.createGateway = function (service, onError) {
  var stickyEnable = amino.get('stickyEnable')
    , stickyCookie = amino.get('stickyCookie')
    , stickyIP = amino.get('stickyIP')
    , stickyQuery = amino.get('stickyQuery')
    , maxSockets = amino.get('maxSockets')

  if (maxSockets !== false && typeof maxSockets !== 'number') {
    maxSockets = 25000;
  }

  function setupRequest (req, cb) {
    req.on('error', function (err) {
      console.error(err, '#error');
    });
    var clientId;
    if (stickyEnable) {
      if (stickyCookie && req.headers.cookie) {
        clientId = cookie.parse(req.headers.cookie)[stickyCookie];
      }
      else if (stickyIP) {
        if (req.headers['x-forwarded-for']) {
          clientId = req.headers['x-forwarded-for'].split(/\s?,\s?/)[0];
        }
        else {
          clientId = req.socket.remoteAddress;
        }
      }
      else if (stickyQuery) {
        var query = parseUrl(req.url, true).query;
        if (query && query[stickyQuery]) {
          clientId = query[stickyQuery];
        }
      }
    }
    req._sReq = amino.requestService(service, req.headers['x-amino-version'], clientId)
    req._sReq.on('spec', cb);
  }

  function onReqError (err, req, res, sReq, spec) {
    console.error(err, '#error on ' + spec);
    sReq.emit('error', err);
    if (onError) {
      onError(err, req, res);
    }
    else {
      res.writeHead(500, {'content-type': 'text/plain'});
      res.write('Internal server error. Please try again later.');
      res.end();
    }
  }

  if (maxSockets) {
    httpProxy.setMaxSockets(maxSockets);
  }
  var server = httpProxy.createServer(function (req, res, proxy) {
    var buffer = httpProxy.buffer(req);
    setupRequest(req, function (spec) {
      req._spec = spec;
      proxy.proxyRequest(req, res, {host: spec.host, port: spec.port, buffer: buffer});
    });
  });
  server.proxy.on('proxyError', function (err, req, res) {
    console.log('error', err);
    onReqError(err, req, res, req._sReq, req._spec);
    return true;
  });
  return server;
};
