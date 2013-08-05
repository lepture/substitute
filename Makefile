test_node = node_modules/.bin/mocha tests/test_node.js

coverage:
	@$(test_node) --require blanket -R html-cov > coverage.html
test:
	@$(test_node)

coveralls:
	@$(test_node) --require blanket -R mocha-lcov-reporter | node_modules/.bin/coveralls

.PHONY: test coverage coveralls
