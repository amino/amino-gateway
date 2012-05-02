var http = require('http');

module.exports.createServer = function(amino, service, onError) {
  return http.createServer(function (req, res) {
    var options = {
      url: 'amino://' + service + req.url,
      method: req.method,
      headers: req.headers
    };
    req.pipe(amino.request(options, function(err) {
      if (err) {
        if (onError) {
          onError(err, req, res);
        }
        else {
          res.writeHead(500, {'content-type': 'text/plain'});
          res.write('Internal server error. Please try again later.');
          res.end();
        }
      }
    })).pipe(res);
  });
};
