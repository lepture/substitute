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
  var digest = md5.hmac(this.secret, src);

  var regex = /(https?)\:\/\/([^\/]+)\/?(.*)?$/;

  var m = src.match(regex);
  if (!m) {
    throw new Error(src + ' is not a url');
  }

  var domain = '';
  if (m[1] === 'http') {
    domain += '0';
  } else {
    domain += '1';
  }
  domain += m[2].split('').reverse().join('');

  var urlpath = '';
  if (m[3]) {
    urlpath = m[3].replace(/#.*$/, '');
    // urlpath can't contain #
    urlpath = urlpath.replace(/\//g, '#');
  }

  return this.server + domain + '/' + digest + '/' + encodeURIComponent(urlpath);
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


/**
 * Exports substitute API.
 */
exports = module.exports = new Substitute();
exports.Substitute = Substitute;
