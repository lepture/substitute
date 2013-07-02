var http = require('http');
var crypto = require('crypto');
var createServer = require('./');

var secretKey = 'secret';

describe('proxy image', function() {
  it('should proxy valid image url', function(done) {
    equalStatus('http://media.ebaumsworld.com/picture/Mincemeat/Pimp.jpg', 200, done);
  });
});


function request(uri, cb) {
  var server = createServer(secretKey);
  server.listen(9067, function() {
    var hmac = crypto.createHmac('md5', secretKey);
    hmac.update(uri);
    var digest = hmac.digest('hex');
    var newUri = 'http://localhost:9067/' + digest + '/';
    newUri += encodeURIComponent(uri);
    http.get(newUri, function(resp) {
      cb(resp);
      server.close();
    });
  });
}

function equal(a, b) {
  if (a !== b) {
    throw new Error(a + ' is not equal to ' + b);
  }
}

function equalStatus(uri, code, done) {
  request(uri, function(resp) {
    equal(code, resp.statusCode);
    done();
  });
}
