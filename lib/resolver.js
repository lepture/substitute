
var url = require('url');
var crypto = require('crypto');


function decodeSrc(src) {
  var uri = '';

  var m = src.split('/');
  if (m.length < 3) {
    return null;
  }

  var domain = m[0];
  var digest = m[1];
  var urlpath = m.slice(2).join('/');
  urlpath = decodeURIComponent(urlpath);
  var protocol = domain.charAt(0);

  if (protocol === '-') {
    uri += 'https://';
    domain = domain.slice(1);
  } else {
    uri += 'http://';
  }

  uri += domain.split('').reverse().join('') + '/';
  uri += urlpath;
  return {uri: uri, digest: digest};
}

exports.digest = function(secretKey) {
  return function(req) {
    var uri = url.parse(req.url);
    var ref = decodeSrc(uri.path.replace(/^\//, ''));
    if (!ref) {
      return null;
    }
    var hmac = crypto.createHmac('md5', secretKey);
    hmac.update(ref.uri);
    var digests = [hmac.digest('hex')];
    hmac = crypto.createHmac('md5', secretKey);
    hmac.update(encodeURI(ref.uri));
    digests.push(hmac.digest('hex'));
    if (digests.indexOf(ref.digest) === -1) {
      return null;
    }
    return ref.uri;
  };
};

exports.proxy = function(headerKey) {
  headerKey = headerKey.toLowerCase();
  return function(req) {
    return req.headers[headerKey];
  };
};
