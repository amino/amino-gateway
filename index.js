var cookie = require('cookie')
  , parseUrl = require('url').parse
  , fs = require('fs')
  , http = require('http')
  , https = require('https')
  , httpProxy = require('http-proxy')
  , addr = require('addr')
  , cluster = require('cluster')

exports.attach = function (options) {
  options || (options = {});
  var amino = this;

  amino.createGateway = function (opts) {

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
      } catch (err2) {
        // oh well, not much we can do at this point.
        console.error('Error closing server', err2.stack || err2);
      }
    });

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
      // WebSockets have no res
      else if (res && !res.headersSent) {
        res.writeHead(500, {'content-type': 'text/plain'});
        res.write('Internal server error. Please try again later.');
        res.end();
      }
    }

    if (options.maintPage) {
      var maintPage = require('dish').file(options.maintPage);
    }

    var proxy = httpProxy.createProxyServer();

    function doRequest (req, res) {
      if (options.maintMode) {
        var remoteIp = addr(req);
        if (options.maintIps && ~options.maintIps.indexOf(remoteIp)) doProxy();
        else {
          maintPage(req, res, 503);
        }
      }
      else {
        doProxy();
      }

      function doProxy () {
        setupRequest(req, function (spec) {
          req._spec = spec;
          d.run(function () {
            proxy.web(req, res, { target: spec }, function httpErrorHandler (err, req, res) {
              onReqError(err, req, res, req._sReq, req._spec);
            });
          });
        });
      }
    }
    
    var server;
    if (options.tls && Array.isArray(options.tls)) {
      var tls={};
      for (var i=0; i<options.tls.length; ++i) {
        var match=options.tls[i].match(/^([^=]+)=(.+)$/);
        if (match) {
          if (match[1]=="pfx" || match[1]=="key" || match[1]=="cert" || match[1]=="ca") {
            match[2]=fs.readFileSync(match[2]);
          }
          if (tls[match[1]]) {
            if (Array.isArray(tls[match[1]])) {
              tls[match[1]].push(match[2]);
            } else {
              tls[match[1]]=[tls[match[1]],match[2]];
            }
          } else {
            tls[match[1]]=match[2];
          }
        }
      }
      server = https.createServer(tls,doRequest);
    } else {
      server = http.createServer(doRequest);
    }

    server.on('upgrade', function (req, socket, head) {
      setupRequest(req, function (spec) {
        req._spec = spec;
        d.run(function () {
          proxy.ws(req, socket, head, { target: spec }, function wsErrorHandler (err, req, socket) {
            onReqError(err, req, null, req._sReq, req._spec);
            socket.destroy();
          });
        });
      });
    });

    return server;
  };
};
