var url = require('url');
var http = require('http');
var crypto = require('crypto');
var createServer = require('../');
var client = require('../client');

var PORT = 9000;
var secretKey = 'secret';
client.secret = secretKey;


describe('proxy image', function() {
  it('can query homepage', function(done) {
    equalStatus('', 200, done);
  });

  it('can query status', function(done) {
    equalStatus('status', 200, done);
  });

  it('should proxy valid image url', function(done) {
    equalStatus('http://s3.amazonaws.com/github/ribbons/forkme_right_darkblue_121621.png', 200, done);
  });

  it('should encode & decode well', function(done) {
    equalStatus('http://mweb.baidu.com/wp-content/uploads/2012/12/图片1.png', 200, done);
  });

  it('should valid with image query', function(done) {
    equalStatus('http://zhouguangming.qiniudn.com/2014-03-23-001.jpg?imageView/0/w/650', 200, done);
  });

  it.skip('must request with referer', function(done) {
    equalStatus('http://www.zhengtan.me/wp-content/uploads/2012/09/Wtc-2004-memorial.jpg', 200, done);
  });

  it('should not proxy html', function(done) {
    equalStatus('https://github.com', 404, done);
  });

  it('should not proxy self', function(done) {
    equalStatus('http://localhost:9067/', 404, done);
  });

  it('can query favicon', function(done) {
    equalStatus('favicon.ico', 200, done);
  });

  it('should follow redirects', function(done) {
    equalStatus('http://git.io/top', 404, done);
  });

  it('did not match digest', function(done) {
    var server = createServer(secretKey);
    server.listen(9091, function() {
      var newUri = url.parse('http://localhost:9091/foo/bar');
      newUri.agent = false;
      http.get(newUri, function(resp) {
        equal(resp.statusCode, 404);
        server.close();
        done();
      });
    });
  });

  it('can change defaults', function(done) {
    createServer.defaults({
      maxRedirects: 4,
      excludedHosts: ['example.com']
    });
    equalStatus('http://example.com/foo', 404, done);
  });

  it('has a large content length', function(done) {
    var server = http.createServer(function(req, res) {
      res.writeHead(200, {'content-length': 99999999});
      res.end('ok');
    });
    server.listen(9092, function() {
      equalStatus('http://localhost:9092/foo', 404, done);
    });
  });

  it.skip('can handle errors', function(done) {
    equalStatus('http://', 404, done);
  });

  it('will exceeded max redirects', function(done) {
    var server = http.createServer(function(req, res) {
      res.writeHead(302, {'Location': 'http://localhost:9088/'});
      res.end('ok');
    });
    server.listen(9093, function() {
      equalStatus('http://localhost:9093/', 404, done);
    });
  });

  it('can handle invalid redirect', function(done) {
    var server = http.createServer(function(req, res) {
      res.writeHead(302, {'Location': 'abc'});
      res.end('ok');
    });
    server.listen(9094, function() {
      equalStatus('http://localhost:9094/', 404, done);
    });
  });

  it('can handle 304', function(done) {
    var server = http.createServer(function(req, res) {
      res.writeHead(304);
      res.end('ok');
    });
    server.listen(9304, function() {
      equalStatus('http://localhost:9304/', 304, done);
    });
  });

  it('can handle invalid protocal', function(done) {
    var server = createServer(secretKey);
    request('9moc.dlrowsmuabe.aidem/48f589a429000f26b790eb3e33f6a685/picture/Mincemeat/Pimp.jpg', function(resp) {
      equal(resp.statusCode, 404);
      done();
    });
  });
});


function request(uri, port, cb) {
  if (typeof port === 'function') {
    cb = port;
    port = PORT;
    PORT = PORT + 1;
  }

  var server = createServer(secretKey);
  server.listen(port, function() {
    if (/https?\:\/\//.test(uri)) {
      uri = client.link(uri);
    }
    var newUri = url.parse('http://localhost:' + port + '/' + uri);
    newUri.agent = false;
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
