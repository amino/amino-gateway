var cookie = require('cookie')
  , parseUrl = require('url').parse
  , http = require('http')
  , httpProxy = require('http-proxy')
  , addr = require('addr')
  , cluster = require('cluster')

exports.attach = function (options) {
  options || (options = {});
  var amino = this;

  var d = require('domain').create();
  d.on('error', function (err) {
    console.error('uncaught error!', err.stack || err);

    try {
      // make sure we close down within 30 seconds
      var killtimer = setTimeout(function() {
        process.exit(1);
      }, 30000);
      // But don't keep the process open just for that!
      killtimer.unref();

      // stop taking new requests.
      server.close();

      // Let the master know we're dead.  This will trigger a
      // 'disconnect' in the cluster master, and then it will fork
      // a new worker.
      cluster.worker.disconnect();

      // try to send an error to the request that triggered the problem
      res.writeHead(500, {'content-type': 'text/plain'});
      res.write('Internal server error. Please try again later.');
      res.end();
    } catch (err2) {
      // oh well, not much we can do at this point.
      console.error('Error sending 500!', err2.stack || err2);
    }
  });

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

    // No longer supported by http-proxy -- problem?
    // if (opts.sockets) {
    //   httpProxy.setMaxSockets(opts.sockets);
    // }

    if (options.maintPage) {
      var maintPage = require('dish').file(options.maintPage);
    }

    var proxy = httpProxy.createProxyServer();

    var server = http.createServer(function (req, res) {
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
        setupRequest(req, function (spec) {
          req._spec = spec;
          d.run(function () {
            proxy.web(req, res, { target: spec });
          });
        });
      }
    });

    server.on('upgrade', function (req, socket, head) {
      setupRequest(req, function (spec) {
        req._spec = spec;
        d.run(function () {
          proxy.ws(req, socket, head, { target: spec });
        });
      });
    });

    proxy.on('error', function (err, req, res) {
      onReqError(err, req, res, req._sReq, req._spec);
    });

    return server;
  };
};
