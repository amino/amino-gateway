var amino = require('amino')
  , bouncy = require('bouncy')
  , cookie = require('cookie')
  , parseUrl = require('url').parse
  , httpProxy = require('http-proxy')

module.exports.createGateway = function (service, onError) {
  var stickyEnable = amino.get('stickyEnable')
    , stickyCookie = amino.get('stickyCookie')
    , stickyIP = amino.get('stickyIP')
    , stickyQuery = amino.get('stickyQuery')
    , proxyModule = amino.get('proxyModule') || 'bouncy'
    , maxSockets = amino.get('maxSockets') || 2000

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

  if (proxyModule === 'http-proxy') {
    httpProxy.setMaxSockets(maxSockets);
    var server = httpProxy.createServer(function (req, res, proxy) {
      setupRequest(req, function (spec) {
        req._spec = spec;
        proxy.proxyRequest(req, res, {host: spec.host, port: spec.port});
      });
    });
    server.proxy.on('proxyError', function (err, req, res) {
      onReqError(err, req, res, req._sReq, req._spec);
      return true;
    });
    return server;
  }
  else {
    return bouncy(function (req, bounce) {
      setupRequest(req, function (spec) {
        bounce(spec.host, spec.port).on('error', function (err) {
          onReqError(err, req, bounce.respond(), sReq, spec);
        });
      });
    });
  }
};
