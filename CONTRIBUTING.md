# Contributing

## Setup

1. Clone the repo
2. Copy `server/.env.example` to `server/.env` and fill in values
3. Copy `client/.env.example` to `client/.env` if needed
4. Run `npm install` in both `server/` and `client/`
5. Run `npx prisma generate` in `server/`
6. Start the server: `npm run dev` in `server/`
7. Start the client: `npm run dev` in `client/`

## Code Standards

- Follow existing code style (2-space indentation, semicolons)
- All new API endpoints must include:
  - Fastify JSON Schema validation for body/params/query
  - Rate limiting config for sensitive operations
  - Authentication + authorization guards
- All user input must be sanitized (global sanitizer handles most cases)
- File uploads must use the upload validation plugin

## Testing

- Run `npm test` in `server/` before committing
- All new features should include tests
- Run `npm run build` in `client/` to verify client builds

## Pull Requests

- Target the `develop` branch
- Include a clear description of changes
- Reference related issues

## Security

- Never commit `.env` files
- Never hardcode secrets
- Run `npm audit` regularly
