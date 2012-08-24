var amino = require('amino')
  , cookie = require('cookie')
  , parseUrl = require('url').parse
  , httpProxy = require('http-proxy')
  , addr = require('addr')
  , Spec = require('amino-spec')

module.exports = function createGateway (options) {
  options || (options = {});

  var serviceSpec = new Spec(options.service);

  function setupRequest (req, cb) {
    req.on('error', function (err) {
      console.error(err, '#error');
    });
    var stickyId;
    if (options.sticky) {
      if (options.sticky.cookie && req.headers.cookie) {
        stickyId = cookie.parse(req.headers.cookie)[options.sticky.cookie];
      }
      else if (options.sticky.ip) {
        stickyId = addr(req);
      }
      else if (options.sticky.query) {
        var query = parseUrl(req.url, true).query;
        stickyId = query[options.sticky.query];
      }
    }
    req._sReq = amino.requestService({
      service: serviceSpec.service,
      version: req.headers['x-amino-version'] || serviceSpec.version,
      stickyId: req.headers['x-amino-stickyid'] || stickyId
    }, cb);
  }

  function onReqError (err, req, res, sReq, spec) {
    // For certain errors, we don't want the spec to be released.
    if (['ECONNRESET', 'EADDRNOTAVAIL'].indexOf(err.code) > -1) {
      sReq.emit('error', err);
    }
    // Connection resets, if coming from the client, are not log-worthy.
    if (err.code !== 'ECONNRESET') {
      console.error(err, '#error on ' + spec + ' for ' + req.method + ' ' + req.url);
    }
    if (onError) {
      onError(err, req, res);
    }
    else {
      res.writeHead(500, {'content-type': 'text/plain'});
      res.write('Internal server error. Please try again later.');
      res.end();
    }
  }

  if (options.sockets) {
    httpProxy.setMaxSockets(options.sockets);
  }

  var server = httpProxy.createServer(function (req, res, proxy) {
    var buffer = httpProxy.buffer(req);
    setupRequest(req, function (spec) {
      req._spec = spec;
      proxy.proxyRequest(req, res, {host: spec.host, port: spec.port, buffer: buffer});
    });
  });

  server.on('upgrade', function(req, socket, head) {
    var buffer = httpProxy.buffer(req);
    setupRequest(req, function (spec) {
      req._spec = spec;
      server.proxy.proxyWebSocketRequest(req, socket, head, {host: spec.host, port: spec.port, buffer: buffer});
    });
  });

  server.proxy.on('proxyError', function (err, req, res) {
    onReqError(err, req, res, req._sReq, req._spec);
  });

  return server;
};
