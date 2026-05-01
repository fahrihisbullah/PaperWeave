import { useState } from 'react'
import { signIn } from '../lib/auth-client'
import { Link, useNavigate } from 'react-router-dom'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await signIn.email({ email, password })
      if (result.error) {
        setError(result.error.message ?? 'Unable to sign in')
      } else {
        navigate('/projects')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="w-full max-w-[28rem]">
        {/* Logo */}
        <div className="mb-10 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]"></span>
            <span className="font-display text-[2.2rem] leading-none">PaperWeave</span>
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
          <h1 className="mb-2 text-[1.85rem] font-semibold text-[var(--color-text)]">Sign in</h1>
          <p className="mb-7 text-[15px] leading-relaxed text-[var(--color-text-muted)]">
            Enter your credentials to continue
          </p>

          {error && (
            <div className="mb-5 rounded-xl border border-red-100 bg-red-50 p-3.5 text-[14px] text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-[13px] font-semibold tracking-[0.04em] text-[var(--color-text-muted)] uppercase">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-[15px] text-[var(--color-text)] transition-all focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                placeholder="you@university.edu"
              />
            </div>

            <div>
              <label className="mb-2 block text-[13px] font-semibold tracking-[0.04em] text-[var(--color-text-muted)] uppercase">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-[15px] text-[var(--color-text)] transition-all focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-[var(--color-primary)] px-4 py-3 text-[15px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-[14px] text-[var(--color-text-faint)]">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-[var(--color-primary)] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
