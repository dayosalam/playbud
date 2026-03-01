.PHONY: test test-backend test-frontend

test: test-backend test-frontend

test-backend:
	cd backend && pytest -q

test-frontend:
	cd social-sport-app && npm test
