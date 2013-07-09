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

In the browser, you can generate the digest with component [enyo/md5](https://github.com/enyo/md5).

```
md5.hmac(secretKey, uri)
```

Check out an example for changing `<img>` src with md5:

https://gist.github.com/lepture/5953897


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
