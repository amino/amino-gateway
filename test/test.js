var assert = require('assert')
  , amino = require('amino')
  , child_process = require('child_process')
  , stream = require('stream')
  , util = require('util')
  ;

function ValidationStream(str, cb) {
  this.str = str
  this.buf = ''
  this.on('data', function (data) {
    this.buf += data
  })
  this.on('end', function () {
    assert.strictEqual(this.str, this.buf)
    if (cb) cb();
  })
  this.writable = true
}
util.inherits(ValidationStream, stream.Stream)
ValidationStream.prototype.write = function (chunk) {
  this.emit('data', chunk)
}
ValidationStream.prototype.end = function (chunk) {
  if (chunk) emit('data', chunk)
  this.emit('end')
}

describe('conf', function() {
  var gateway;
  it('supports alternate conf file', function(done) {
    process.on('exit', function() {
      if (gateway) {
        gateway.kill();
      }
    });
    gateway = child_process.execFile('./bin/gateway.js', ['--conf', 'test/test.conf']);
    gateway.stdout.on('data', function(chunk) {
      assert.strictEqual(chunk.toString(), "argyle gateway listening on port 50234...\n", 'settings overridden');
      done();
    });
  });
});

describe('simple proxy', function() {
  var gateway;
  before(function(done) {
    process.on('exit', function() {
      if (gateway) {
        gateway.kill();
      }
    });
    amino.respond('app', function(router) {
      router.get('/robots.txt', function() {
        this.res.text("User-agent: *\nDisallow: /");
      });
      router.post('/post', {stream: true}, function() {
        var chunks = [], req = this.req, res = this.res;
        req.on('data', function(chunk) {
          chunks.push(chunk);
        });
        req.on('end', function() {
          assert.strictEqual(chunks.length, 4, 'correct number of chunks received');
          assert.strictEqual(chunks.join(''), 'abcd', 'request body OK');
          ['e', 'f', 'g', 'h'].forEach(function(chunk) {
            res.write(chunk);
          });
          res.end();
        });
      });
    });
    gateway = child_process.execFile('./bin/gateway.js', ['-p', '55201']);
    gateway.stdout.on('data', function(chunk) {
      assert.strictEqual(chunk.toString(), "app gateway listening on port 55201...\n", 'gateway is listening');
      done();
    });
  });
  it('should proxy basic request', function(done) {
    amino.request('http://localhost:55201/robots.txt', function(err, response, body) {
      assert.ifError(err);
      assert.strictEqual(response.statusCode, 200, 'status is 200');
      assert.strictEqual(body, "User-agent: *\nDisallow: /", 'text is OK');
      done();
    });
  });
  it('should stream a request', function(done) {
    var inputStream = new ValidationStream('abcd');
    var outputStream = new ValidationStream('efgh', done);

    var options = {
      method: 'POST',
      url: 'http://localhost:55201/post'
    };

    inputStream.pipe(amino.request(options)).pipe(outputStream);

    for (var i = 0, len = inputStream.str.length; i < len; i++) {
      inputStream.write(inputStream.str[i]);
    }
    inputStream.end();
  });
});