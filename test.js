var http = require('http');
var crypto = require('crypto');
var createServer = require('./');

var secretKey = 'secret';

describe('proxy image', function() {
  it('can query homepage', function(done) {
    equalStatus('', 200, done);
  });

  it('can query status', function(done) {
    equalStatus('status', 200, done);
  });

  it('should proxy valid image url', function(done) {
    equalStatus('http://media.ebaumsworld.com/picture/Mincemeat/Pimp.jpg', 200, done);
  });

  it('should not proxy html', function(done) {
    equalStatus('http://nodejs.org', 404, done);
  });

  it('should not proxy self', function(done) {
    equalStatus('http://localhost:9067/', 404, done);
  });
});


function request(uri, cb) {
  var server = createServer(secretKey);
  server.listen(9067, function() {
    if (/https?\:\/\//.test(uri)) {
      uri = hmacUri(uri);
    }
    var newUri = 'http://localhost:9067/' + uri;
    http.get(newUri, function(resp) {
      cb(resp);
      server.close();
    });
  });
}

function hmacUri(uri) {
    var hmac = crypto.createHmac('md5', secretKey);
    hmac.update(uri);
    var digest = hmac.digest('hex');
    return digest + '/' + encodeURIComponent(uri);
}

function equal(a, b) {
  if (a !== b) {
    throw new Error(a + ' is not equal to ' + b);
  }
}

function equalStatus(uri, code, done) {
  request(uri, function(resp) {
    done(equal(code, resp.statusCode));
  });
}

function requestData(uri, cb) {
  request(uri, function(resp) {
    resp.setEncoding('utf8');
    var data = '';
    resp.on('data', function(msg) {
      data += msg;
    });
    resp.on('end', function(msg) {
      if (msg) {
        data += msg;
      }
      resp.body = data;
      cb(resp, data);
    });
  });
}