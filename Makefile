coverage:
	@node_modules/.bin/mocha --require blanket -R html-cov > coverage.html

test:
	@node_modules/.bin/mocha

coveralls:
	@node_modules/.bin/mocha --require blanket -R mocha-lcov-reporter | node_modules/.bin/coveralls

.PHONY: test coverage coveralls
