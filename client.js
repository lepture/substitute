var md5 = require('md5');


/**
 * Generate substitute url.
 */
function substitute(src) {
    var digest = md5.hmac(substitute.secret, src);

    var regex = /\.(jpg|jpeg|png|gif)$/i;

    var ext = '';
    var m = src.match(regex);
    if (m) {
      ext = m[0];
    }

    src = src.split('').reverse().join('');
    return substitute.server + digest + '/' + encodeURIComponent(src) + ext;
}


/**
 * Define substitute server.
 */
substitute.server = '';


/**
 * Define substitute secret.
 */
substitute.secret = '';


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
