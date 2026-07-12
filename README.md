# Agenda-me
Agenda builder for BRICS+ Online Advanced Toastmasters Club

## Authentication Setup

This project uses NextAuth with OAuth providers (Google/GitHub).

First-time sign in automatically creates a new user account via Prisma Adapter.

Email + password registration is also supported at `/auth/signin`.

Password policy for credentials login: at least 6 characters, and must include both letters and numbers.

Required environment variables:

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (if using Google)
- `GITHUB_ID` and `GITHUB_SECRET` (if using GitHub)

### Google Login Setup

Google sign-in is already implemented in the codebase. It becomes available automatically once the following variables are configured:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

Local development example:

- `NEXTAUTH_URL=http://localhost:3000`

Netlify production example:

- `NEXTAUTH_URL=https://agenda-me.netlify.app`

Google Cloud Console setup:

1. Go to Google Cloud Console.
2. Create or select a project.
3. Configure the OAuth consent screen.
4. Create an OAuth Client ID for a Web application.
5. Add these Authorized redirect URIs:
	- `http://localhost:3000/api/auth/callback/google`
	- `https://agenda-me.netlify.app/api/auth/callback/google`
6. Copy the generated client ID and client secret into your local `.env` and Netlify environment variables.

After configuration, `/auth/signin` will automatically show a `Continue with Google` button.

When using credentials login, make sure your database schema is updated (the `User.passwordHash` column is required):

- `pnpm prisma:push` (quick sync)
or
- `pnpm prisma:migrate` (recommended for managed environments)

If no provider is configured, `/auth/signin` will show a setup warning and prevent the default server configuration error page.
