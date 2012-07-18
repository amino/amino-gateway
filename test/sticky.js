var assert = require('assert')
  , amino = require('amino')
  , child_process = require('child_process')
  , util = require('util')
  , idgen = require('idgen')
  , cookie = require('cookie')
  ;

describe('sticky session', function() {
  var gateway, specIds = [];
  it('can start with alternate conf file', function(done) {
    process.on('exit', function() {
      if (gateway) {
        gateway.kill();
      }
    });
    gateway = child_process.execFile('./bin/gateway.js', ['--conf', 'test/sticky.conf']);
    gateway.stdout.once('data', function(chunk) {
      assert.ok(chunk.toString().match(/^sticky-test gateway listening .*on port 58402\.\.\.\n$/), 'settings overridden');
      done();
    });
  });
  it('can set up servers', function(done) {
    var numServers = 3, started = 0;
    for (var i = 0; i < numServers; i++) {
      amino.respond('sticky-test', function(router, spec) {
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
    setTimeout(done, 1000);
  });
  it('first clientId only routes to one server', function(done) {
    var clientId = idgen(), numRequests = 100, completed = 0, specId;
    for (var i = 0; i < numRequests; i++) {
      amino.request({url: 'http://localhost:58402/specId', headers: {cookie: cookie.serialize('connect.sid', clientId)}}, function(err, response, body) {
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
    }
  });
});