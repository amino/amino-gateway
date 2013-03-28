describe('failover', function () {
  var gateway, services;

  before(function (done) {
    gateway = execFile('./bin/amino-gateway', ['-s', 'failover@0.1.x', '-p', '50235', '-t', '1']);
    process.once('exit', function () {
      gateway.kill();
    });
    gateway.stdout.once('data', function (chunk) {
      assert.ok(chunk.toString().match(/listening/));
      done();
    });
  });

  before(function (done) {
    var tasks = [];
    for (var i = 0; i < 3; i++) {
      tasks.push(function (cb) {
        var server = createServer(function (req, res) {
          res.end('hello world');
        });
        var service = amino.createService('failover@0.1.5', server);
        service.once('listening', function () {
          cb(null, service);
        });
      });
    }
    async.parallel(tasks, function (err, results) {
      assert.ifError(err);
      services = results;
      done();
    });
  });

  after(function (done) {
    var tasks = services.map(function (service) {
      return service.close.bind(service);
    });
    async.parallel(tasks, done);
  });

  it('waits a bit', function (done) {
    setTimeout(done, 500);
  });

  it('should proxy basic request', function (done) {
    amino.request('http://localhost:50235/', function (err, res, body) {
      assert.ifError(err);
      assert.strictEqual(body, 'hello world');
      done();
    });
  });

  it('should fail over', function (done) {
    // We should only get one error.
    var errCount = 0
      , tasks = []

    for (var i = 0; i < 100; i++) {
      tasks.push(function (cb) {
        amino.request('http://localhost:50235/', function (err, res, body) {
          assert.ifError(err);
          if (res.statusCode === 500) {
            errCount++;
          }
          else {
            assert.equal(res.statusCode, 200);
            assert.equal(body, 'hello world');
          }
          cb(null, 1);
        });
      });
    }

    // Forcefully close one of the servers...
    var idx = Math.floor(Math.random() * 3);
    services[idx].server.removeAllListeners('close');
    services[idx].server.close();
    services.splice(idx, 1);

    async.parallel(tasks, function(err, results) {
      assert(errCount < 3, '<3 errors happend happened');
      done();
    });
  });
});