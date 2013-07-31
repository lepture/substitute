coverage:
	@jscoverage index.js cov.js
	@mv index.js bak.js
	@mv cov.js index.js
	@mocha -R html-cov > coverage.html
	@mv bak.js index.js

test:
	@node_modules/.bin/mocha

coveralls:
	@node_modules/.bin/mocha --require blanket -R mocha-lcov-reporter | node_modules/.bin/coveralls

.PHONY: test coverage coveralls
