
var http = require('http');
var logger = require('./logger');
var resolver = require('./resolver');
var createHandler = require('./handler');

exports.digestServer = function(secretKey, options) {
  var handler = createHandler(resolver.digest(secretKey), options);
  return http.createServer(handler);
};

exports.proxyServer = function(headerKey, options) {
  options.proxyHeader = headerKey;
  var handler = createHandler(resolver.proxy(headerKey), options);
  return http.createServer(handler);
};
