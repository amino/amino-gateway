var amino = require('amino')
  , bouncy = require('bouncy')
  , cookie = require('cookie')
  , parseUrl = require('url').parse

module.exports.createGateway = function(service, onError) {
  var stickyEnable = amino.get('stickyEnable')
    , stickyCookie = amino.get('stickyCookie')
    , stickyIP = amino.get('stickyIP')
    , stickyQuery = amino.get('stickyQuery')

  return bouncy(function(req, bounce) {
    req.on('error', function(err) {
      console.error(err, '#error');
    });
    var clientId
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
    var sReq = amino.requestService(service, req.headers['x-amino-version'], clientId);

    sReq.on('spec', function(spec) {
      bounce(spec.host, spec.port).on('error', function(err) {
        var res = bounce.respond();
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
      });
    });
  });
};
