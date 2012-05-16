var amino = require('amino'),
    bouncy = require('bouncy');

module.exports.createGateway = function(service, onError) {
  return bouncy(function(req, bounce) {
    var sReq = amino.requestService(service);

    req.on('error', function(err) {
      sReq.emit('error', err);
      if (onError) {
        onError(err, req, bounce);
      }
    });

    sReq.on('spec', function(spec) {
      bounce(spec.host, spec.port);
    });
  });
};
