var amino = require('amino')
  , bouncy = require('bouncy')
  , cookie = require('cookie')
  ;

module.exports.createGateway = function(service) {
  var stickyStrategy;
  if (amino.get('stickyEnable')) {
    stickyStrategy = amino.get('stickyStrategy') ? amino.get('stickyStrategy') : 'cookie';
  }

  return bouncy(function(req, bounce) {
    req.on('error', function(err) {
      console.error(err, '#error');
    });
    var clientId;
    if (stickyStrategy) {
      if (stickyStrategy === 'cookie') {
        clientId = cookie.parse(req.headers.cookie)[amino.get('stickyCookie')];
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
