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
  // only allow 4-loop redirects
  basePath: null,
  maxRedirects: 4,
  // only allow images < 5M
  contentLength: 5242880,
  excludedHosts: /.*\.example\.com/
};


/**
 * Change default options.
 */
function defaults(options) {
  options = options || {};
  Object.keys(options).forEach(function(key) {
    _options[key] = options[key];
  });
  return _options;
}

function decodeSrc(src) {
  var uri = '';

  var m = src.split('/');
  if (m.length !== 3) {
    return null;
  }

  var domain = m[0];
  var digest = m[1];
  var urlpath = m[2];

  var protocol = domain.charAt(0);

  if (protocol == '0') {
    uri += 'http://';
  } else if (protocol == '1') {
    uri += 'https://';
  } else {
    return null;
  }

  uri += domain.slice(1).split('').reverse().join('') + '/';
  uri += decodeURIComponent(urlpath).replace(/#/g, '/');
  return {uri: uri, digest: digest};
}


/**
 * Create the substitute server.
 */
function createServer(secretKey, options) {
  defaults(options);

  var server = http.createServer(function(req, resp) {
    var pathname = req.url;

    if (_options.basePath) {
      if (pathname.indexOf(_options.basePath) !== 0) {
        return abort404(resp, 'Not found');
      }
      pathname = pathname.replace(_options.basePath, '');
      if (pathname.charAt(0) !== '/') {
        pathname = '/' + pathname;
      }
    }

    if (req.headers['via'] && req.headers['via'] == viaHeader) {
      return abort404(resp, 'Requesting from self');
    }

    if (req.method != 'GET' || pathname === '/') {
      resp.writeHead(200);
      return resp.end('humor');
    } else if (pathname === '/favicon.ico') {
      resp.writeHead(200);
      return resp.end('ok');
    } else if (pathname === '/status') {
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
    var uri = url.parse(pathname);

    var ref = decodeSrc(uri.pathname.replace(/^\//, ''));

    if (ref) {
      var hmac = crypto.createHmac('md5', secretKey);
      hmac.update(ref.uri);
      if (hmac.digest('hex') !== ref.digest) {
        return abort404(resp, 'Digest does not match');
      }
      return proxy(ref.uri, headers, resp, _options.maxRedirects || 4);
    } else {
      return abort404(resp, 'Missing pathname');
    }
  });
  return server;
}
createServer.version = version;
createServer.defaults = defaults;
module.exports = createServer;


/**
 * Proxy request for the images.
 */
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

  if (/wp-content\/uploads/.test(uri.pathname)) {
    // sepcial handle for wordpress
    headers['referer'] = uri.protocol + '//' + uri.host + '/';
  }

  headers.host = uri.host;
  uri.headers = headers;
  uri.agent = false;

  http.get(uri, function(imgResp) {
    var contentLength = imgResp.headers['content-length'];
    if (contentLength > _options.contentLength) {
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
  }).on('error', function(e) {
    // process.stderr.write(e.stack);
    return abort404(resp, e.message);
  });
}


/**
 * Response with 404.
 */
function abort404(resp, msg) {
  msg = msg || 'Not Found';
  resp.writeHead(404);
  finish(resp, msg);
}


/**
 * Response end message.
 */
function finish(resp, msg) {
  if (currentConnections < 1) {
    currentConnections = 0;
  } else {
    currentConnections -= 1;
  }
  return resp.connection && resp.end(msg);
}


/**
 * Detect if the host is excluded.
 */
function isExcluded(host) {
  if (host && !host.match(RESTRICTED_IPS)) {
    return host.match(_options.excludedHosts);
  } else {
    return true;
  }
}
