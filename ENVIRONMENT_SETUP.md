# Environment Setup

## Required Variables (server/.env)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | 64+ char random hex string |
| `FRONTEND_URL` | Client URL (e.g., http://localhost:5173) |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |

## Optional Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3000) |
| `BOOTSTRAP_SECRET` | Secret for initial setup endpoint |
| `NODE_ENV` | `development` or `production` |
| `SENTRY_DSN` | Sentry error monitoring DSN |
| `BCRYPT_ROUNDS` | Hash rounds (default: 12, recommended: 14) |
| `CLOUDINARY_*` | Cloudinary image upload credentials |
| `EMAIL_*` | EmailJS or Gmail SMTP credentials |
| `GROQ_API_KEY` | Groq AI API key |

## Security Checklist

- [ ] `JWT_SECRET` is at least 64 random characters
- [ ] `BOOTSTRAP_SECRET` is set (prevents unauthorized setup)
- [ ] `ALLOWED_ORIGINS` only includes trusted domains in production
- [ ] `NODE_ENV=production` in production
- [ ] `SENTRY_DSN` configured for error monitoring
- [ ] `BCRYPT_ROUNDS` >= 14 for production (2026 standard)

## Production Deployment

```bash
cp server/.env.example server/.env
# Edit .env with production values
cd server && npm run start:production
```
