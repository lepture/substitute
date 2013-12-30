describe('substitute', function() {
  var substitute;
  if (process && process.env) {
    // in node
    substitute = require('../client');
  } else {
    substitute = require('substitute');
  }

  function equal(a, b) {
    if (a !== b) {
      throw new Error(a + ' not equal ' + b);
    }
  }

  beforeEach(function() {
    substitute.server = '';
    substitute.secret = '';
  });

  it('can generate url', function() {
    equal(
      '0moc.oof/11f7137f6ab2e19167dec729cafa658a/bar%23baz.jpg',
      substitute.link('http://foo.com/bar/baz.jpg')
    );

    substitute.server = 'https://example.com/';
    equal(
      'https://example.com/0moc.oof/6b8591a52be19251fd22c8559d1c6d6e/bar',
      substitute.link('http://foo.com/bar')
    );

    substitute.secret = 'bar';
    equal(
      'https://example.com/0moc.oof/fa38cae1b3af34170554986c2a8ebf8e/bar',
      substitute.link('http://foo.com/bar')
    );
  });

  it('can replace image', function() {
    substitute.server = 'https://example.com/';
    substitute.secret = 'bar';
    var ret = substitute.image('<div><img src="http://foo.com/bar"><b>bold</b></div>');
    equal(ret, '<div><img src="https://example.com/0moc.oof/fa38cae1b3af34170554986c2a8ebf8e/bar"><b>bold</b></div>');
  });

  it('will not replace image', function() {
    var html = '<div><img src="http://foo.com/bar"><b>bold</b></div>';
    var ret = substitute.image(
      html,
      function(src) {
        return false;
      }
    );
    equal(ret, html);
  });

});
