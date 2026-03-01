.PHONY: test test-backend test-frontend

test: test-backend test-frontend

test-backend:
	cd backend && \
	( [ -x .venv/bin/pytest ] && .venv/bin/pytest -q || pytest -q )

test-frontend:
	cd social-sport-app && npm test
