
var url = require('url');
var path = require('path');
var http = require('http');


function request(src, headers, timeout, cb) {
  // 1 second
  timeout = timeout || 1000;

  if (!src.pathname) {
    src = url.parse(src);
  }

  if (/wp-content\/uploads/.test(src.pathname)) {
    // sepcial handle for wordpress
    headers['referer'] = src.protocol + '//' + src.host + '/';
  }

  headers.host = src.host;
  src.headers = headers;
  src.agent = false;

  // resolve clean path
  src.path = src.pathname = path.resolve(src.pathname).replace(/\\/g, '/');

  var req, timer;

  timer = setTimeout(function() {
    if (req) {
      req.abort();
    }
    cb('timeout');
  }, timeout);

  req = http.get(src, function(resp) {
    clearTimeout(timer);
    cb(null, resp);
  }).on('error', function(err) {
    clearTimeout(timer);
    cb(err);
  });
}

module.exports = request;
