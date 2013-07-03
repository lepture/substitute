coverage:
	@jscoverage index.js cov.js
	@mv index.js bak.js
	@mv cov.js index.js
	@mocha -R html-cov > coverage.html
	@mv bak.js index.js

test:
	@mocha

.PHONY: test coverage
