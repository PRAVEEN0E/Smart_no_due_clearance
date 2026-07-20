# Security Policy

## Authentication

- JWT tokens are stored in **httpOnly cookies** — NOT accessible from JavaScript
- `SameSite: Lax` prevents CSRF from external sites
- `Secure` flag enabled in production (HTTPS only)
- Tokens expire after 7 days
- No refresh tokens are used (short session window reduces attack surface)

## CSRF Protection

- All state-changing requests (POST, PUT, PATCH, DELETE) require a CSRF token
- The CSRF token is obtained from `GET /api/csrf-token`
- Sent as `X-CSRF-Token` header
- CSRF secret is stored in an httpOnly cookie

## XSS Prevention

- All user input is sanitized server-side before processing
- HTML tags are stripped from text fields
- Script tags and event handlers are removed from rich text
- Email addresses are lowercased and sanitized
- File names are sanitized to prevent path traversal

## File Upload Security

- Allowed MIME types and extensions are whitelisted per category
- Executable files (.exe, .bat, .sh, etc.) are blocked
- Double-extension attacks are detected
- File names are randomized on save
- Maximum file size enforced (varies by category)

## Security Headers

- Content Security Policy (CSP) restricts script/style sources
- HSTS enabled (1 year, includeSubDomains, preload)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- X-XSS-Protection enabled

## Rate Limiting

- Global: 100 requests/minute per IP
- Login: 5 requests/minute
- Register: 3 requests/10 minutes
- Change Password: 3 requests/5 minutes
- Admin broadcast: 3 requests/5 minutes
- Admin impersonation: 5 requests/minute

## Environment Variables

- All secrets are stored in `.env` (gitignored)
- Required vars validated at startup
- `JWT_SECRET` must be >= 32 characters
- `NODE_ENV=production` enforces HTTPS-only CORS origins

## Reporting Vulnerabilities

Report security issues to the repository maintainer.
Do not file public issues for security vulnerabilities.
