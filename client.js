var md5 = require('md5');

function Substitute(options) {
  options = options || {};
  this.server = options.server || '';
  this.secret = options.secret || '0x24FEEDFACEDEADBEEFCAFE';
}

/**
 * Generate substitute link
 */
Substitute.prototype.link = function(src) {
  // domain/digest/path
  var regex = /(https?)\:\/\/([^\/]+)\/?(.*)?$/;

  var m = src.match(regex);
  if (!m) {
    throw new Error(src + ' is not a url');
  }

  var domain = '';
  if (m[1] === 'https') {
    domain += '-';
  }
  domain += m[2].split('').reverse().join('');

  var urlpath = '';
  if (m[3]) {
    urlpath = realpath(m[3].replace(/#.*$/, ''));
  }
  src = m[1] + '://' + m[2] + '/' + urlpath;
  var digest = md5.hmac(this.secret, src);
  return this.server + domain + '/' + digest + '/' + urlpath;
};

/**
 * Replace image src.
 */
Substitute.prototype.image = function(html, filter) {
  var me = this;
  html = html.replace(/<img[^>]*src=('|")(https?:\/\/.*?)\1[^>]*>/g, function(img) {
    var src = RegExp.$2;
    if (filter && !filter(src)) {
      return img;
    }
    return img.replace(src, me.link(src));
  });
  return html;
};

var DOT_RE = /\/\.\//g;
var DOUBLE_DOT_RE = /\/[^/]+\/\.\.\//;
var DOUBLE_SLASH_RE = /([^:/])\/\//g;

function realpath(path) {
  path = path.replace(/^\.*\//, '');
  // /a/b/./c/./d ==> /a/b/c/d
  path = path.replace(DOT_RE, "/");

  // a/b/c/../../d  ==>  a/b/../d  ==>  a/d
  while (path.match(DOUBLE_DOT_RE)) {
    path = path.replace(DOUBLE_DOT_RE, "/");
  }

  // a//b/c  ==>  a/b/c
  path = path.replace(DOUBLE_SLASH_RE, "$1/");
  return path;
}

/**
 * Exports substitute API.
 */
exports = module.exports = new Substitute();
exports.Substitute = Substitute;
