describe('substitute', function() {
  var substitute = require('substitute');

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
      '4d33f7cd9856290bb0e00ba00fe98245/moc.oof%2F%2F%3Aptth',
      substitute('http://foo.com')
    );

    substitute.server = 'https://example.com/';
    equal(
      substitute('http://foo.com'),
      'https://example.com/4d33f7cd9856290bb0e00ba00fe98245/moc.oof%2F%2F%3Aptth'
    );

    substitute.secret = 'bar';
    equal(
      substitute('http://foo.com'),
      'https://example.com/77e558c14d08464e074d01a9eda6a72d/moc.oof%2F%2F%3Aptth'
    );
  });

  it('can replace image', function() {
    substitute.server = 'https://example.com/';
    substitute.secret = 'bar';
    var ret = substitute.image('<div><img src="http://foo.com"><b>bold</b></div>');
    equal(ret, '<div><img src="https://example.com/77e558c14d08464e074d01a9eda6a72d/moc.oof%2F%2F%3Aptth"><b>bold</b></div>');
  });

  it('will not replace image', function() {
    var html = '<div><img src="http://foo.com"><b>bold</b></div>';
    var ret = substitute.image(
      html,
      function(src) {
        return false;
      }
    );
    equal(ret, html);
  });

});
