var amino = require('amino'),
    bouncy = require('bouncy');

module.exports.createGateway = function(service, onError) {
  return bouncy(function(req, bounce) {
    var sReq = amino.requestService(service);

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
