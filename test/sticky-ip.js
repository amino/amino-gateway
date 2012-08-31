describe('sticky session (ip-based)', function () {
  var gateway, services, specIds = [];

  before(function (done) {
    gateway = execFile('./bin/amino-gateway', ['-s', 'sticky-test-ip', '-p', '58403', '--stickyIp']);
    gateway.stdout.once('data', function (chunk) {
      assert.ok(chunk.toString().match(/^sticky-test-ip gateway listening .*on port 58403\.\.\.\n$/), 'settings overridden');
      done();
    });
  });

  before(function (done) {
    var tasks = [];
    for (var i = 0; i < 3; i++) {
      tasks.push(function (cb) {
        var server = createServer(function (req, res) {
          res.writeHead(200, {'Content-Type': 'text/plain'});
          res.end(service.spec.id);
        });
        var service = amino.createService('sticky-test-ip', server);
        service.once('listening', function () {
          specIds.push(service.spec.id);
          cb(null, service);
        });
      });
    }
    async.parallel(tasks, function (err, results) {
      services = results;
      done(err);
    });
  });

  after(function (done) {
    gateway.kill();
    var tasks = services.map(function (service) { return service.close.bind(service); });
    async.parallel(tasks, done);
  });

  it('waits a bit', function (done) {
    setTimeout(done, 500);
  });

  it('only routes to one server', function (done) {
    var clientId = amino.utils.idgen(), numRequests = 100, started = 0, completed = 0, specId;
    process.nextTick(function nextRequest () {
      amino.request({url: 'http://localhost:58403/', headers: {'X-Forwarded-For': '42.35.23.13, 62.44.11.5'}}, function (err, res, body) {
        assert.ifError(err);
        assert.strictEqual(res.statusCode, 200, 'status is 200');
        assert.ok(specIds.indexOf(body) !== -1, 'spec known');
        if (specId) {
          assert.strictEqual(body, specId, 'routed to only one spec');
        }
        specId = body;
        if (++completed === numRequests) {
          done();
        }
      });
      if (++started < numRequests) {
        process.nextTick(nextRequest);
      }
    });
  });
});