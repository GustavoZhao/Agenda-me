import Link from "next/link"

const ERROR_HELP: Record<string, string> = {
  Configuration:
    "Auth provider is not configured. Check NEXTAUTH_URL, NEXTAUTH_SECRET, and at least one OAuth provider key pair.",
  AccessDenied: "Access was denied by the provider or user canceled authorization.",
  Verification: "Verification token is invalid or expired.",
  OAuthSignin: "Could not start OAuth sign-in flow.",
  OAuthCallback: "OAuth callback failed. Verify callback URL and provider credentials.",
}

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const errorCode = params.error ?? "Configuration"
  const message = ERROR_HELP[errorCode] ?? "Unknown authentication error. Check server logs for details."

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-foreground">Authentication Error</h1>
        <p className="mt-3 text-sm text-muted-foreground">Error code: {errorCode}</p>
        <p className="mt-2 text-sm text-foreground">{message}</p>

        <div className="mt-6 flex items-center gap-2">
          <Link
            href="/auth/signin"
            className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
          >
            Try sign in again
          </Link>
          <Link href="/" className="text-sm text-primary hover:underline">
            Back to editor
          </Link>
        </div>
      </div>
    </main>
  )
}
