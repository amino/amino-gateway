describe('simple proxy', function () {
  var gateway, service;

  before(function (done) {
    gateway = execFile('./bin/gateway.js', ['-s', 'argyle@0.1.x', '-p', '50234']);
    gateway.stdout.once('data', function (chunk) {
      assert.ok(chunk.toString().match(/^argyle@0.1.x gateway listening .*on port 50234\.\.\.\n$/), 'settings overridden');
      done();
    });
    process.once('exit', function () {
      gateway.kill();
    });
  });

  before(function (done) {
    var server = createServer(function (req, res) {
      if (req.url === '/robots.txt') {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('User-agent: *\nDisallow: /');
      }
      else if (req.url === '/post') {
        assert.equal(req.method, 'POST');
        req.pipe(res);
      }
    });
    service = amino.createService('argyle@0.1.5', server);
    service.once('listening', done);
  });

  after(function (done) {
    service.close(done);
  });

  it('waits a bit', function (done) {
    setTimeout(done, 500);
  });

  it('should proxy basic request', function (done) {
    amino.request('http://localhost:50234/robots.txt', function (err, res, body) {
      assert.ifError(err);
      assert.strictEqual(body, 'User-agent: *\nDisallow: /');
      done();
    });
  });

  it('should stream a request', function (done) {
    var inputStream = new ValidationStream('abcd');
    var outputStream = new ValidationStream('abcd', done);

    var options = {
      method: 'POST',
      url: 'http://localhost:50234/post'
    };

    inputStream.pipe(amino.request(options)).pipe(outputStream);

    for (var i = 0, len = inputStream.str.length; i < len; i++) {
      inputStream.write(inputStream.str[i]);
    }
    inputStream.end();
  });
});