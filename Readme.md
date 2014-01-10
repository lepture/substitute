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
    --path <path>          The pathname to listen [null]
    -c, --config <file>    Specify a configuration file
    -r, --redirects <num>  Max redirects allowed, default is 4
    -s, --secret <token>   A secret token to encrypto urls
    -V, --version          Display the version
    -h, --help             Display this help menu
```


## URL Formats

Unlike camo, substitute supports only one URL Format:

```
http://example.org/<reverse-domain>/<digest>/<image-path>
```

The `<digest>` is a 32 character hex encoded HMAC digest with a secret in md5 hash. And the `<image-path>` should be an ecoded/escaped replaced '/' uri.

```
http://example.org/0moc.dlrowsmuabe.aidem/d42a08bfa19e5b526b0d2d53eb3b106c/picture/Mincemeat/Pimp.jpg
```


## Browser Support

You can get the browser client with [component(1)](http://component.io):

    $ component install lepture/substitute

And generate new src with:

```js
var substitute = require('substitute');
substitute.server = 'https://example.com';
substitute.secret = 'a secret that match the server secret';

var newSrc = substitute.link('http://path/to/image');

// replace all image src
var newHtml = substitute.image(html);
```


## Testing

Test it manally, start a server:

```
$ substitute
```

And then visit: [this link](http://localhost:8000/0moc.dlrowsmuabe.aidem/d42a08bfa19e5b526b0d2d53eb3b106c/picture/Mincemeat/Pimp.jpg).

Test it automatically with mocha:

```
$ make test
```

You can also test the client part with:

```
$ make test-client
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
