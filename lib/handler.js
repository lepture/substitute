
var http = require('http');
var url = require('url');
var format = require('util').format;

var logger = require('./logger');
var request = require('./request');

var version = require('../package').version;
var random = parseInt(Math.random() * 1000, 10);
var viaHeader = 'Substitute ' + version + ' ' + random;

var currentConnections = 0;
var totalConnections = 0;
var startedTime = new Date();

var defaults = {
  // only allow 4-loop redirects
  proxyURL: null,
  proxyTimeout: 4000,
  proxyHeader: 'X-Substitute-Fetch',
  maxRedirects: 4,
  timeout: 1000,
  // only allow images < 5M
  contentLength: 5242880,
  excludedHosts: /.*\.example\.com/
};

var RESTRICTED_IPS = /^((10\.)|(127\.)|(169\.254)|(192\.168)|(172\.((1[6-9])|(2[0-9])|(3[0-1]))))/;


/**
 * Create the substitute handler.
 */
function createHandler(resolve, options) {
  // merge defaults
  options = options || {};
  Object.keys(options).forEach(function(key) {
    defaults[key] = options[key];
  });
  // set logger level
  if (options.level) {
    logger.setLevel(options.level);
  }

  return function(req, resp) {

    if (req.headers['via'] && req.headers['via'] === viaHeader) {
      return abort404(resp, 'Requesting from self');
    }

    var pathname = req.url;

    if (req.method !== 'GET' || pathname === '/') {
      resp.writeHead(200);
      return resp.end('humor');
    } else if (pathname === '/favicon.ico') {
      resp.writeHead(200);
      return resp.end('ok');
    } else if (pathname === '/status') {
      resp.writeHead(200);
      return resp.end(format('ok %s/%s since %s', currentConnections, totalConnections, startedTime));
    }
    delete req.headers.cookie;

    var src = resolve(req);
    if (!src) {
      return abort404(resp, 'Resolve request failed.');
    }
    logger.info('Fetch image: ' + src);

    totalConnections += 1;
    currentConnections += 1;

    var headers = {
      'via': viaHeader,
      'user-agent': req.headers['user-agent'] || viaHeader
    };

    if (req.headers['accept-encoding']) {
      headers['accept-encoding'] = req.headers['accept-encoding'];
    }
    return fetch(decodeURI(src), headers, resp, defaults.maxRedirects);
  };
}

module.exports = createHandler;


/**
 * Fetch the images.
 */
function fetch(uri, headers, resp, redirects, timeout) {
  // make sure the uri is a parsed object
  if (!uri.pathname) {
    uri = url.parse(uri);
  }

  if (uri.protocol !== 'http:') {
    return abort404(resp, 'Invalid protocal: ' + uri.protocol);
  }
  if (isExcluded(uri.host)) {
    return abort404(resp, 'Excluded Host: ' + uri.host);
  }

  request(uri, headers, defaults.timeout, function(err, imgResp) {
    if (err === 'timeout') {
      headers[defaults.proxyHeader] = uri.href;
      return proxy(resp, headers);
    } else if (err) {
      return abort404(resp, err.message);
    }

    var contentLength = imgResp.headers['content-length'];
    if (contentLength > defaults.contentLength) {
      return abort404(resp, 'Content-Length Exceeded');
    }

    var isFinished = true;

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
        return success(resp, imgResp);
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
        if (!((newUri.host !== null) && (newUri.hostname !== null))) {
          newUri.host = newUri.hostname = uri.hostname;
          newUri.protocol = uri.protocol;
        }
        return fetch(newUri, headers, resp, redirects - 1);
      case 304:
        resp.writeHead(304, formatHeaders(imgResp));
        resp.end();
        break;
      default:
        return abort404(resp, 'Respond with: ' + imgResp.statusCode);
    }
  });
}


/**
 * Response with 404.
 */
function abort404(resp, msg) {
  msg = msg || 'Not Found';
  resp.writeHead(404);
  logger.warn(msg);
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
 * Success response with image response.
 */
function success(resp, imgResp) {
  var headers = formatHeaders(imgResp);
  if (headers['content-type'] && headers['content-type'].slice(0, 5) !== 'image') {
    return abort404(resp, "Non-Image content-type returned");
  }
  resp.writeHead(200, headers);
  return imgResp.pipe(resp);
}


/**
 * Return with proxy response.
 */
function proxy(resp, headers) {
  if (!defaults.proxyURL) {
    return abort404(resp, 'Request Timeout');
  }
  request(defaults.proxyURL, headers, defaults.proxyTimeout, function(err, proxyResp) {
    if (err) {
      return abort404(resp, 'Proxy failed: ' + err.message);
    }
    if (proxyResp.statusCode === 200) {
      return success(resp, proxyResp);
    }
    return abort404(resp, 'Proxy with: ' + proxyResp.statusCode);
  });
}

/**
 * Generate headers from response.
 */
function formatHeaders(resp) {
    var headers = {
      'content-type': resp.headers['content-type'],
      'cache-control': resp.headers['cache-control'] || 'public, max-age=31536000'
    };
    var keys = ['content-length', 'transfer-encoding', 'content-encoding'];

    keys.forEach(function(key) {
      var rv = resp.headers[key];
      if (rv) {
        headers[key] = rv;
      }
    });
    return headers;
}

/**
 * Detect if the host is excluded.
 */
function isExcluded(host) {
  if (host && !host.match(RESTRICTED_IPS)) {
    return host.match(defaults.excludedHosts);
  } else {
    return true;
  }
}
