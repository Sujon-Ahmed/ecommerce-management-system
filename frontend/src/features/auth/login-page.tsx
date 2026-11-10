import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/form/field'
import { useAuth } from '@/features/auth/auth-context'
import { homePathFor } from '@/features/auth/home-path'
import { loginSchema, type LoginValues } from '@/features/auth/schemas'
import { errorMessage } from '@/lib/errors'

interface LoginLocationState {
  from?: string
}

const demoAccounts = [
  { label: 'Admin', email: 'admin@example.com' },
  { label: 'Dhaka owner', email: 'owner.dhaka@example.com' },
  { label: 'Sylhet owner', email: 'owner.sylhet@example.com' },
]

const DEMO_PASSWORD = 'Password@123!'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: LoginValues) {
    setFormError(null)

    try {
      const user = await login(values)
      const state = location.state as LoginLocationState | null
      navigate(state?.from ?? homePathFor(user), { replace: true })
    } catch (error) {
      setFormError(errorMessage(error))
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex xl:p-14">
        <div
          className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-primary/30 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-accent/10 blur-3xl"
          aria-hidden="true"
        />

        <Link to="/" className="relative flex items-center gap-3">
          <img src="/favicon.svg" alt="" className="size-10 rounded-xl" />
          <div>
            <p className="text-lg font-semibold leading-none">ShopSphere</p>
            <p className="mt-1 text-xs text-sidebar-muted">Multi-shop commerce</p>
          </div>
        </Link>

        <div className="relative max-w-md space-y-6">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-balance">
            One catalog. Every shop. Your own storefront.
          </h1>
          <p className="text-sm leading-relaxed text-sidebar-muted">
            Run shops across Bangladesh from a single control room — shared
            products, shop-specific pricing, and a public storefront that only
            shows what each shop actually sells.
          </p>

          <ul className="space-y-3 text-sm">
            {[
              'Central product catalog with per-shop overrides',
              'Owner accounts scoped to exactly their shops',
              'Storefront visibility that can never leak inventory',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <ShieldCheck
                  className="mt-0.5 size-4 shrink-0 text-accent"
                  aria-hidden="true"
                />
                <span className="text-sidebar-foreground/90">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-sidebar-muted">
          Built for the CSN Bangladesh technical assessment.
        </p>
      </aside>

      <main className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-sm space-y-7">
          <div className="space-y-2 lg:hidden">
            <div className="flex items-center gap-2.5">
              <img src="/favicon.svg" alt="" className="size-9 rounded-lg" />
              <span className="text-lg font-semibold">ShopSphere</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
            <p className="text-sm text-muted-foreground">
              Use your administrator or shop-owner account.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {formError ? (
              <div
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/8 px-3 py-2 text-sm text-destructive"
              >
                {formError}
              </div>
            ) : null}

            <Field label="Email" htmlFor="email" error={errors.email?.message}>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="pl-9"
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  {...register('email')}
                />
              </div>
            </Field>

            <Field
              label="Password"
              htmlFor="password"
              error={errors.password?.message}
            >
              <div className="relative">
                <LockKeyhole
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Your password"
                  className="pl-9 pr-10"
                  aria-invalid={errors.password ? true : undefined}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </Field>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          <div className="rounded-lg border border-dashed bg-muted/40 p-3">
            <p className="text-xs font-medium text-muted-foreground">
              Demo accounts · password{' '}
              <code className="rounded bg-card px-1 py-0.5 font-mono text-[11px] text-foreground">
                {DEMO_PASSWORD}
              </code>
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {demoAccounts.map((account) => (
                <Button
                  key={account.email}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setValue('email', account.email, { shouldValidate: true })
                    setValue('password', DEMO_PASSWORD, { shouldValidate: true })
                  }}
                >
                  {account.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
