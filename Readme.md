# Substitute

A proxy image server. This is a rewrite version of [camo](https://github.com/atmos/camo).


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
    -r, --redirects <num>  Max redirects allowed, default is 4
    -s, --secret <token>   A secret token to encrypto urls
    -V, --version          Display the version
    -h, --help             Display this help menu
```


## URL Formats

Unlink camo, substitute only support one URL Format:

```
http://example.org/<digest>/<image-url>
```

The `<digest>` is a 32 character hex encoded HMAC digest with a secret in md5 hash.

In the browser, you can generate the digest with component [enyo/md5](https://github.com/enyo/md5).

```
md5.hmac(secretKey, uri)
```


## Testing

Test it manally, start a server:

```
$ substitute
```

And then visit: `http://localhost:8000/d42a08bfa19e5b526b0d2d53eb3b106c/http%3A%2F%2Fmedia.ebaumsworld.com%2Fpicture%2FMincemeat%2FPimp.jpg`

Test it automatically with mocha:

```
$ mocha
```

## API

This library has only one API:

```js
var substitute = require('substitute');
console.log(substitute.version);
var server = substitute(secret, maxRedirects);
server.listen(8000)
```

`substitute` accepts three parameters:

- secret: a secret token for digest
- maxRedirects: max redirects number for 30x redirecting
- excludedHosts: hosts to be excluded
