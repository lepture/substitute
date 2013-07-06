var http = require('http');
var url = require('url');
var crypto = require('crypto');
var format = require('util').format;

var version = require('./package').version;
var viaHeader = 'Substitute ' + version;

var currentConnections = 0;
var totalConnections = 0;
var startedTime = new Date();

const RESTRICTED_IPS = /^((10\.)|(127\.)|(169\.254)|(192\.168)|(172\.((1[6-9])|(2[0-9])|(3[0-1]))))/;


var _options = {
  maxRedirects: 4,
  excludedHosts: /.*\.example\.com/
};


function defaults(options) {
  options = options || {};
  if (options.maxRedirects) {
    _options.maxRedirects = options.maxRedirects;
  }
  if (options.excludedHosts) {
    _options.excludedHosts = options.excludedHosts;
  }
  return _options;
}


function createServer(secretKey) {
  var server = http.createServer(function(req, resp) {
    if (req.headers['via'] && req.headers['via'] == viaHeader) {
      return abort404(resp, 'Requesting from self');
    }

    if (req.method != 'GET' || req.url === '/') {
      resp.writeHead(200);
      return resp.end('humor');
    } else if (req.url === '/favicon.ico') {
      resp.writeHead(200);
      return resp.end('ok');
    } else if (req.url === '/status') {
      resp.writeHead(200);
      return resp.end(format('ok %s/%s since %s', currentConnections, totalConnections, startedTime));
    }

    totalConnections += 1;
    currentConnections += 1;

    var headers = {
      'via': viaHeader,
      'user-agent': req.headers['user-agent'] || viaHeader
      // 'accept': req.headers.accept || 'image/*'
    };
    if (req.headers['accept-encoding']) {
      headers['accept-encoding'] = req.headers['accept-encoding'];
    }
    delete req.headers.cookie;
    var uri = url.parse(req.url);
    var ref = uri.pathname.replace(/^\//, '').split("/", 2);
    var digest = ref[0], encodedUri = ref[1];
    if (digest && encodedUri) {
      var decodedUri = decodeURIComponent(encodedUri);
      var hmac = crypto.createHmac('md5', secretKey);
      hmac.update(decodedUri);
      if (hmac.digest('hex') !== digest) {
        return abort404(resp, 'Digest does not match');
      }
      return proxy(decodedUri, headers, resp, _options.maxRedirects || 4);
    } else {
      return abort404(resp, 'Missing pathname');
    }
  });
  return server;
}
createServer.version = version;
createServer.defaults = defaults;
module.exports = createServer;

function proxy(uri, headers, resp, redirects) {
  // make sure the uri is a parsed object
  if (!uri.pathname) {
    uri = url.parse(uri);
  }
  if (uri.protocol !== 'http:') {
    return abort404(resp, 'Invalid protocal', uri.protocol);
  }
  if (isExcluded(uri.host)) {
    return abort404(resp, 'Excluded Host');
  }

  headers.host = uri.host;
  uri.headers = headers;
  uri.agent = false;

  http.get(uri, function(imgResp) {
    // only allow images < 5M
    var contentLength = imgResp.headers['content-length'];
    if (contentLength > 5242880) {
      return abort404(resp, 'Content-Length Exceeded');
    }

    var isFinished = true;
    var newHeaders = {
      'content-type': imgResp.headers['content-type'],
      'cache-control': imgResp.headers['cache-control'] || 'public, max-age=31536000'
    };
    if (contentLength) {
      newHeaders['content-length'] = contentLength;
    }
    if (imgResp.headers['transfer-encoding']) {
      newHeaders['transfer-encoding'] = imgResp.headers['transfer-encoding'];
    }
    if (imgResp.headers['content-encoding']) {
      newHeaders['content-encoding'] = imgResp.headers['content-encoding'];
    }

    imgResp.on('end', function() {
      if (isFinished) {
        return finish(resp);
      }
    });
    imgResp.on('error', function() {
      if (isFinished) {
        return finish(resp);
      }
    });

    switch (imgResp.statusCode) {
      case 200:
        if (newHeaders['content-type'] && newHeaders['content-type'].slice(0, 5) !== 'image') {
          return abort404(resp, "Non-Image content-type returned");
        }
        resp.writeHead(200, newHeaders);
        return imgResp.pipe(resp);
      case 301:
      case 302:
      case 303:
      case 307:
        if (redirects <= 0) {
          return abort404(resp, 'Exceeded max depth');
        }
        isFinished = false;
        var newUrl = imgResp.headers['location'];
        var newUri = url.parse(newUrl);
        if (!((newUri.host != null) && (newUri.hostname != null))) {
          newUri.host = newUri.hostname = uri.hostname;
          newUri.protocol = uri.protocol;
        }
        return proxy(newUri, headers, resp, redirects - 1);
      case 304:
        resp.writeHead(304, newHeaders);
        resp.end();
        break;
      default:
        return abort404(resp, 'Respond with: ' + imgResp.statusCode);
    }
  });
}


function abort404(resp, msg) {
  msg = msg || 'Not Found';
  resp.writeHead(404);
  finish(resp, msg);
}


function finish(resp, msg) {
  if (currentConnections < 1) {
    currentConnections = 0;
  } else {
    currentConnections -= 1;
  }
  return resp.connection && resp.end(msg);
}


function isExcluded(host) {
  if (host && !host.match(RESTRICTED_IPS)) {
    return host.match(_options.excludedHosts);
  } else {
    return true;
  }
}
