# Testing

## Test Structure

```
__tests__/
  unit/         # Unit tests (vitest) — 8 files, 126 tests
  integration/  # API integration tests (vitest) — 2 files, 38 tests
  load/         # Load & benchmark tests
```

### Unit Tests (10 files, 126 tests)
- `cache.test.js` (13) — Redis cache layer
- `queue.test.js` (8) — BullMQ queue operations
- `storage.test.js` (7) — Cloudinary storage helpers
- `repository.test.js` (19) — BaseRepository (CRUD, pagination, transactions)
- `authService.test.js` (11) — AuthService (login, profile, password, bootstrap)
- `userService.test.js` (9) — UserService (CRUD, search, bulk create)
- `responses.test.js` (12) — Response helpers (success/error/status codes)
- `constants.test.js` (6) — Constants validation

### Integration Tests (2 files, 38 tests)
- `api.test.js` (5) — Health, auth, validation, CORS, rate limiting
- `mentor.test.js` (33) — Mentor endpoints: staff, students, subjects, announcements, audit logs, analytics, hall tickets, AI, college, export, edge cases, response format

## Running Tests

```bash
# Full test suite (unit + integration when server is running)
npm test

# Unit tests only
npm test -- __tests__/unit/

# Integration tests only (requires running server on port 3000)
npm run test:integration

# Single integration test file
npm run test:integration -- __tests__/integration/mentor.test.js

# Watch mode
npm run test:watch

# Load test (requires running server)
node __tests__/load/benchmark.js
```

**Note:** Integration tests gracefully skip assertions when the server is not running (status 0). Run the server with `node server.js` before running integration tests.

## E2E Tests (Playwright)

```bash
cd client
npx playwright install
npx playwright test
```

## Coverage Targets

- Unit tests: >80% coverage
- Integration tests: all critical paths (auth, CRUD, pagination, filters, error handling, edge cases)
- E2E tests: login, navigation, CRUD flows
