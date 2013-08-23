test_node = node_modules/.bin/mocha tests/test_node.js tests/test_browser.js

coverage:
	@$(test_node) --require blanket -R html-cov > coverage.html

test:
	@node_modules/.bin/component install
	@rm -fr node_modules/md5
	@mv components/enyo-md5 node_modules/md5
	@$(test_node)

coveralls:
	@$(test_node) --require blanket -R mocha-lcov-reporter | node_modules/.bin/coveralls

components: component.json
	@component install --dev

build: components client.js
	@component build --dev

test-client: build
	@mocha-browser tests/index.html

coverage-client: components
	@jscoverage client.js client-cov.js
	@mv client.js client-bak.js
	@mv client-cov.js client.js
	@$(MAKE) build
	@mv client-bak.js client.js
	@mocha-browser tests/index.html -R html-cov > coverage.html


.PHONY: test coverage coveralls components build test-client
