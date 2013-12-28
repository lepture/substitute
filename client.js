var md5 = require('md5');


/**
 * Generate substitute url.
 */
function substitute(src) {
  // domain/digest/path
  var digest = md5.hmac(substitute.secret, src);

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

  return substitute.server + domain + '/' + digest + '/' + encodeURIComponent(urlpath);
}


/**
 * Define substitute server.
 */
substitute.server = '';


/**
 * Define substitute secret.
 */
substitute.secret = '0x24FEEDFACEDEADBEEFCAFE';


/**
 * Replace image src.
 */
substitute.image = function(html, filter) {
  html = html.replace(/<img[^>]*src=('|")(https?:\/\/.*?)\1[^>]*>/g, function(img) {
    var src = RegExp.$2;
    if (filter && !filter(src)) {
      return img;
    }
    return img.replace(src, substitute(src));
  });
  return html;
};


/**
 * Exports substitute API.
 */
module.exports = substitute;
