describe('maintenance mode', function () {
  var gateway, service;

  function doRequest (cb) {
    amino.request('http://localhost:50388/robots.txt', function (err, res, body) {
      assert.ifError(err);
      cb(res, body);
    });
  }

  before(function (done) {
    gateway = execFile('./bin/amino-gateway', ['-s', 'maintenance@0.1.x', '-p', '50388', '--maintPage', require('path').resolve(__dirname, 'fixtures/maintPage.txt')]);
    gateway.stdout.once('data', function (chunk) {
      assert.ok(chunk.toString().match(/^maintenance@0.1.x gateway listening .*on port 50388\.\.\.\n$/), 'settings overridden');
      done();
    });
    gateway.on('exit', function () {
      throw new Error('gateway died');
    });
    process.once('exit', function () {
      gateway.removeAllListeners('exit');
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
    service = amino.createService('maintenance@0.1.5', server);
    service.once('listening', done);
  });

  before(function (done) {
    // give it a half-second
    setTimeout(done, 500);
  });

  after(function (done) {
    service.close(done);
  });

  it('should not start in maintenance mode', function (done) {
    doRequest(function (res, body) {
      assert.equal(res.statusCode, 200);
      assert.strictEqual(body, 'User-agent: *\nDisallow: /');
      done();
    });
  });

  it('should enter maintenance mode on SIGUSR2', function (done) {
    gateway.kill('SIGUSR2');
    setTimeout(function () {
      doRequest(function (res, body) {
        assert.equal(res.statusCode, 503);
        assert.strictEqual(body, 'In maintenance mode. Try again later. kthxbai');
        done();
      });
    }, 250);
  });

  it('should exit maintenance mode on another SIGUSR2', function (done) {
    gateway.kill('SIGUSR2');
    setTimeout(function () {
      doRequest(function (res, body) {
        assert.equal(res.statusCode, 200);
        assert.strictEqual(body, 'User-agent: *\nDisallow: /');
        done();
      });
    }, 250);
  });
});