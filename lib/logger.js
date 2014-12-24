
var LEVELS = {
  'debug': 0,
  'info': 1,
  'warn': 2,
  'error': 3,
  'quiet': 9
};

var l = 1;

exports.setLevel = function(level) {
  l = LEVELS[level.toLowerCase()] || 1;
};

exports.debug = function() {
  if (l === 0) {
    console.log.apply(this, arguments);
  }
};

exports.info = function() {
  if (l < 2) {
    console.info.apply(this, arguments);
  }
};

exports.warn = function() {
  if (l < 3) {
    console.warn.apply(this, arguments);
  }
};

exports.error = function() {
  if (l === 4) {
    console.error.apply(this, arguments);
  }
};
