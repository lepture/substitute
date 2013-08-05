test_node = node_modules/.bin/mocha tests/test_node.js

coverage:
	@$(test_node) --require blanket -R html-cov > coverage.html
test:
	@$(test_node)

coveralls:
	@$(test_node) --require blanket -R mocha-lcov-reporter | node_modules/.bin/coveralls

components: component.json
	@component install --dev

build: components client.js
	@component build --dev

test-client:
	@mocha-browser tests/index.html

coverage-client:
	@jscoverage client.js client-cov.js
	@mv client.js client-bak.js
	@mv client-cov.js client.js
	@$(MAKE) build
	@mv client-bak.js client.js
	@mocha-browser tests/index.html -R html-cov > coverage.html


.PHONY: test coverage coveralls components build test-client
