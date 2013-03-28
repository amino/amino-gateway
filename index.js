var cookie = require('cookie')
  , parseUrl = require('url').parse
  , httpProxy = require('http-proxy')
  , addr = require('addr')

exports.attach = function (options) {
  options || (options = {});
  var amino = this;

  amino.createGateway = function (opts) {
    opts = amino.utils.copy(opts);
    var serviceSpec = new amino.Spec(opts.service);

    function setupRequest (req, cb) {
      req.on('error', function (err) {
        console.error(err, '#error');
      });
      var stickyId;
      if (opts.stickyCookie || opts.stickyIp || opts.stickyQuery) {
        if (opts.stickyCookie && req.headers.cookie) {
          stickyId = cookie.parse(req.headers.cookie)[opts.stickyCookie];
        }
        else if (opts.stickyIp) {
          stickyId = addr(req);
        }
        else if (opts.stickyQuery) {
          var query = parseUrl(req.url, true).query;
          stickyId = query[opts.stickyQuery];
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
      if (['ECONNRESET', 'EADDRNOTAVAIL'].indexOf(err.code) === -1) {
        sReq.emit('error', err);
      }
      // Connection resets, if coming from the client, are not log-worthy.
      if (err.code !== 'ECONNRESET') {
        console.error(err, '#error on ' + spec + ' for ' + req.method + ' ' + req.url);
      }
      if (opts.onError) {
        opts.onError(err, req, res);
      }
      else {
        res.writeHead(500, {'content-type': 'text/plain'});
        res.write('Internal server error. Please try again later.');
        res.end();
      }
    }

    if (opts.sockets) {
      httpProxy.setMaxSockets(opts.sockets);
    }

    if (options.maintPage) {
      var maintPage = require('dish').file(options.maintPage);
    }

    var server = httpProxy.createServer(function (req, res, proxy) {
      if (options.maintMode) {
        var remoteIp = addr(req);
        if (options.maintIps && ~options.maintIps.indexOf(remoteIp)) doProxy();
        else {
          maintPage(req, res, 500);
        }
      }
      else {
        doProxy();
      }

      function doProxy () {
        var buffer = httpProxy.buffer(req);
        setupRequest(req, function (spec) {
          req._spec = spec;
          proxy.proxyRequest(req, res, {host: spec.host, port: spec.port, buffer: buffer});
        });
      }
    });

    server.on('upgrade', function (req, socket, head) {
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
};
