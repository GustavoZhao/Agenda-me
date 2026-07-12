"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"

type ProviderInfo = {
  id: string
  name: string
  type: string
  signinUrl: string
}

function validatePassword(password: string): {
  minLengthOk: boolean
  hasLetter: boolean
  hasNumber: boolean
  valid: boolean
} {
  const minLengthOk = password.length >= 6
  const hasLetter = /[A-Za-z]/.test(password)
  const hasNumber = /\d/.test(password)
  return {
    minLengthOk,
    hasLetter,
    hasNumber,
    valid: minLengthOk && hasLetter && hasNumber,
  }
}

export default function SignInPage() {
  const [providers, setProviders] = useState<ProviderInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const passwordCheck = validatePassword(password)

  useEffect(() => {
    async function loadProviders() {
      try {
        const response = await fetch("/api/auth/providers")
        const data = (await response.json()) as Record<string, ProviderInfo>
        const list = Object.values(data ?? {})
        setProviders(list)
      } catch {
        setProviders([])
      } finally {
        setLoading(false)
      }
    }

    loadProviders()
  }, [])

  const oauthProviders = useMemo(
    () => providers.filter((provider) => provider.type === "oauth"),
    [providers]
  )

  const hasProvider = useMemo(() => oauthProviders.length > 0, [oauthProviders.length])

  async function handleCredentialsSignIn() {
    setBusy(true)
    setAuthMessage(null)

    const result = await signIn("credentials", {
      email,
      password,
      callbackUrl: "/",
      redirect: false,
    })

    setBusy(false)

    if (result?.ok && result.url) {
      window.location.href = result.url
      return
    }

    if (result?.error === "CredentialsSignin") {
      setAuthMessage("Email or password is incorrect.")
    } else {
      setAuthMessage("Unable to sign in. Please try again.")
    }
  }

  async function handleRegister() {
    setBusy(true)
    setAuthMessage(null)

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    })

    setBusy(false)

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({ error: "Registration failed" }))) as {
        error?: string
      }
      setAuthMessage(payload.error ?? "Registration failed")
      return
    }

    const signInResult = await signIn("credentials", {
      email,
      password,
      callbackUrl: "/",
      redirect: false,
    })

    if (signInResult?.ok && signInResult.url) {
      window.location.href = signInResult.url
      return
    }

    setAuthMessage("Registration successful. Please sign in with your email and password.")
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-foreground">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use email/password or OAuth providers. First-time OAuth sign in automatically creates your account.
        </p>

        <div className="mt-4 grid gap-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Name (for registration)"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            type="email"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            type="password"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          />

          <p className="text-xs text-muted-foreground">
            Password rule: at least 6 characters, must include letters and numbers.
          </p>
          {!passwordCheck.valid && password.length > 0 ? (
            <p className="text-xs text-amber-700">
              Missing: {!passwordCheck.minLengthOk ? "6 characters " : ""}
              {!passwordCheck.hasLetter ? "letter " : ""}
              {!passwordCheck.hasNumber ? "number" : ""}
            </p>
          ) : null}

          <div className="flex items-center gap-2">
            <Button type="button" onClick={handleCredentialsSignIn} disabled={busy || !email || !password}>
              {busy ? "Please wait..." : "Sign in with Email"}
            </Button>
            <Button type="button" variant="outline" onClick={handleRegister} disabled={busy || !email || !password || !passwordCheck.valid}>
              Register
            </Button>
          </div>
        </div>

        {authMessage ? <p className="mt-3 text-sm text-muted-foreground">{authMessage}</p> : null}

        {loading ? <p className="mt-4 text-sm text-muted-foreground">Loading providers...</p> : null}

        {!loading && hasProvider ? (
          <div className="mt-4 space-y-2">
            {oauthProviders.map((provider) => (
              <Button
                key={provider.id}
                type="button"
                className="w-full"
                onClick={() => signIn(provider.id, { callbackUrl: "/" })}
              >
                Continue with {provider.name}
              </Button>
            ))}
          </div>
        ) : null}

        {!loading && !hasProvider ? (
          <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            <p className="font-medium">No OAuth provider is configured.</p>
            <p className="mt-1">
              Email/password still works. To add social login, configure at least one provider in environment variables, for example:
              GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET or GITHUB_ID / GITHUB_SECRET.
            </p>
          </div>
        ) : null}

        <div className="mt-5 flex items-center justify-between">
          <Link href="/" className="text-sm text-primary hover:underline">
            Back to editor
          </Link>
          <Link href="/auth/error" className="text-xs text-muted-foreground hover:underline">
            Auth troubleshooting
          </Link>
        </div>
      </div>
    </main>
  )
}
