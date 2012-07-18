var amino = require('amino')
  , bouncy = require('bouncy')
  , cookie = require('cookie')
  ;

module.exports.createGateway = function(service) {
  var stickyStrategy, stickyCookie;
  if (amino.get('stickyEnable')) {
    stickyStrategy = amino.get('stickyStrategy') ? amino.get('stickyStrategy') : 'cookie';
    if (stickyStrategy === 'cookie') {
      stickyCookie = amino.get('stickyCookie');
    }
  }

  return bouncy(function(req, bounce) {
    req.on('error', function(err) {
      console.error(err, '#error');
    });
    var clientId;
    if (stickyStrategy) {
      if (stickyStrategy === 'cookie' && stickyCookie && req.headers.cookie) {
        clientId = cookie.parse(req.headers.cookie)[stickyCookie];
      }
      else if (stickyStrategy === 'ip') {
        if (req.headers['x-forwarded-for']) {
          clientId = req.headers['x-forwarded-for'].split(/\s?,\s?/)[0];
        }
        else {
          clientId = req.socket.remoteAddress;
        }
        console.log(clientId);
      }
    }
    var sReq = amino.requestService(service, req.headers['x-amino-version'], clientId);

    sReq.on('spec', function(spec) {
      bounce(spec.host, spec.port).on('error', function(err) {
        var res = bounce.respond();
        console.error(err, '#error on ' + spec);
        sReq.emit('error', err);
        if (options.onError) {
          options.onError(err, req, res);
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
