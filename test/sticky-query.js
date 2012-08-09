var assert = require('assert')
  , amino = require('amino')
  , child_process = require('child_process')
  , util = require('util')
  , idgen = require('idgen')
  ;

describe('sticky session (query-based)', function() {
  var gateway, specIds = [];
  it('can start with alternate conf file', function(done) {
    process.on('exit', function() {
      if (gateway) {
        gateway.kill();
      }
    });
    gateway = child_process.execFile('./bin/gateway.js', ['--conf', 'test/sticky-query.conf']);
    gateway.stdout.once('data', function(chunk) {
      assert.ok(chunk.toString().match(/^sticky-test-query gateway listening .*on port 58404\.\.\.\n$/), 'settings overridden');
      done();
    });
  });
  it('can set up servers', function(done) {
    var numServers = 3, started = 0;
    for (var i = 0; i < numServers; i++) {
      amino.respond('sticky-test-query', function(router, spec) {
        specIds.push(spec.id);
        router.get('/specId', function() {
          this.res.text(spec.id);
        });
        if (++started === numServers) {
          done();
        }
      });
    }
  });
  it('waits a bit', function(done) {
    setTimeout(done, 500);
  });
  it('only routes to one server', function(done) {
    var clientId = idgen(), numRequests = 100, started = 0, completed = 0, specId;
    process.nextTick(function nextRequest() {
      amino.request({url: 'http://localhost:58404/specId?sid=' + clientId}, function(err, response, body) {
        assert.ifError(err);
        assert.strictEqual(response.statusCode, 200, 'status is 200');
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