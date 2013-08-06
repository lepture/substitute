# Substitute

A proxy image server. This is a rewrite version of [camo](https://github.com/atmos/camo).


[![Build Status](https://travis-ci.org/lepture/substitute.png?branch=master)](https://travis-ci.org/lepture/substitute)
[![Coverage Status](https://coveralls.io/repos/lepture/substitute/badge.png?branch=master)](https://coveralls.io/r/lepture/substitute)


## Installation

Install with npm:

```
$ npm install substitute -g
```


## Quick Help

```
$ substitute -h

  Usage: substitute [options]

  Options:

    -b, --bind <port>      The port or unix path to listen
    --host <host>          The hostname to listen [localhost]
    -c, --config <file>    Specify a configuration file
    -r, --redirects <num>  Max redirects allowed, default is 4
    -s, --secret <token>   A secret token to encrypto urls
    -V, --version          Display the version
    -h, --help             Display this help menu
```


## URL Formats

Unlike camo, substitute supports only one URL Format:

```
http://example.org/<digest>/<image-url>
```

The `<digest>` is a 32 character hex encoded HMAC digest with a secret in md5 hash. And the `<image-url>` should be an ecoded/escaped uri.

## Browser Support

You can get the browser client:

    $ component install lepture/substitute

And generate new src with:

```js
var substitute = require('substitute');
substitute.server = 'https://example.com';
substitute.secret = 'a secret that match the server secret';

var newSrc = substitute('http://path/to/image');

// replace all image src
var newHtml = substitute.image(html);
```

## Testing

Test it manally, start a server:

```
$ substitute
```

And then visit: [this link](http://localhost:8000/d42a08bfa19e5b526b0d2d53eb3b106c/http%3A%2F%2Fmedia.ebaumsworld.com%2Fpicture%2FMincemeat%2FPimp.jpg).

Test it automatically with mocha:

```
$ mocha
```

## API


```js
var substitute = require('substitute');
console.log(substitute.version);

substitute.defaults({
    maxRedirects: 5
});

var server = substitute(secret, options);
server.listen(8000)
```
