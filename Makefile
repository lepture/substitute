prepare:
	@node_modules/.bin/component install
	@rm -fr node_modules/md5
	@mv components/enyo/md5/master node_modules/md5

coverage:
	@npm run-script test-cov

test: prepare
	@npm test

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


.PHONY: prepare test coverage
