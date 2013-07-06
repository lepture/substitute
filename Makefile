coverage:
	@jscoverage index.js cov.js
	@mv index.js bak.js
	@mv cov.js index.js
	@mocha -R html-cov > coverage.html
	@mv bak.js index.js


test:
	@node_modules/.bin/mocha

coveralls:
	@jscoverage index.js cov.js
	@mv cov.js index.js

.PHONY: test coverage coveralls
