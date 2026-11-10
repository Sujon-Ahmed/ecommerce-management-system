import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { KeyRound, Loader2, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Field } from '@/components/form/field'
import { PageHeader } from '@/components/page-header'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { updatePasswordRequest, updateProfileRequest } from '@/features/auth/api'
import { useAuth } from '@/features/auth/auth-context'
import { applyFieldErrors, errorMessage } from '@/lib/errors'
import { formatDate } from '@/lib/format'

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(255),
  phone: z.string().max(30),
})

type ProfileValues = z.infer<typeof profileSchema>

const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Enter your current password'),
    password: z
      .string()
      .min(8, 'Use at least 8 characters')
      .regex(/[A-Za-z]/, 'Include at least one letter')
      .regex(/\d/, 'Include at least one number'),
    password_confirmation: z.string(),
  })
  .refine((values) => values.password === values.password_confirmation, {
    path: ['password_confirmation'],
    message: 'Passwords do not match',
  })

type PasswordValues = z.infer<typeof passwordSchema>

export function AccountPage() {
  const { user, setUser } = useAuth()
  const [profileError, setProfileError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? '',
      phone: user?.phone ?? '',
    },
  })

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: '',
      password: '',
      password_confirmation: '',
    },
  })

  const profileMutation = useMutation({
    mutationFn: updateProfileRequest,
    onSuccess: (updated) => {
      setUser(updated)
      setProfileError(null)
      toast.success('Profile updated')
    },
    onError: (error) => {
      const apiError = applyFieldErrors(error, profileForm.setError)
      setProfileError(
        Object.keys(apiError.fieldErrors).length > 0 ? null : apiError.message,
      )
      toast.error(errorMessage(error))
    },
  })

  const passwordMutation = useMutation({
    mutationFn: updatePasswordRequest,
    onSuccess: () => {
      setPasswordError(null)
      passwordForm.reset({
        current_password: '',
        password: '',
        password_confirmation: '',
      })
      toast.success('Password updated', {
        description: 'Other sessions have been signed out.',
      })
    },
    onError: (error) => {
      const apiError = applyFieldErrors(error, passwordForm.setError)
      setPasswordError(
        Object.keys(apiError.fieldErrors).length > 0 ? null : apiError.message,
      )
      toast.error(errorMessage(error))
    },
  })

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Account settings"
        description="Update your profile and keep your password secure."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UserRound className="size-5" aria-hidden="true" />
              </span>
              <div>
                <CardTitle>Profile</CardTitle>
                <CardDescription>How your name appears across ShopSphere.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={profileForm.handleSubmit((values) =>
                profileMutation.mutate(values),
              )}
              noValidate
              className="space-y-4"
            >
              {profileError ? <Alert tone="destructive">{profileError}</Alert> : null}

              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Member since {formatDate(user.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((role) => (
                      <Badge key={role} variant="secondary" className="capitalize">
                        {role.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <Field
                label="Name"
                htmlFor="profile-name"
                error={profileForm.formState.errors.name?.message}
                required
              >
                <Input
                  id="profile-name"
                  aria-invalid={
                    profileForm.formState.errors.name ? true : undefined
                  }
                  {...profileForm.register('name')}
                />
              </Field>

              <Field
                label="Phone"
                htmlFor="profile-phone"
                error={profileForm.formState.errors.phone?.message}
              >
                <Input
                  id="profile-phone"
                  placeholder="+88017…"
                  aria-invalid={
                    profileForm.formState.errors.phone ? true : undefined
                  }
                  {...profileForm.register('phone')}
                />
              </Field>

              <Button type="submit" disabled={profileMutation.isPending}>
                {profileMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Save profile'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <KeyRound className="size-5" aria-hidden="true" />
              </span>
              <div>
                <CardTitle>Password</CardTitle>
                <CardDescription>
                  Changing your password signs out other devices.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={passwordForm.handleSubmit((values) =>
                passwordMutation.mutate(values),
              )}
              noValidate
              className="space-y-4"
            >
              {passwordError ? <Alert tone="destructive">{passwordError}</Alert> : null}

              <Field
                label="Current password"
                htmlFor="password-current"
                error={passwordForm.formState.errors.current_password?.message}
                required
              >
                <Input
                  id="password-current"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={
                    passwordForm.formState.errors.current_password ? true : undefined
                  }
                  {...passwordForm.register('current_password')}
                />
              </Field>

              <Field
                label="New password"
                htmlFor="password-new"
                error={passwordForm.formState.errors.password?.message}
                hint="At least 8 characters with letters and numbers."
                required
              >
                <Input
                  id="password-new"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={
                    passwordForm.formState.errors.password ? true : undefined
                  }
                  {...passwordForm.register('password')}
                />
              </Field>

              <Field
                label="Confirm new password"
                htmlFor="password-confirm"
                error={passwordForm.formState.errors.password_confirmation?.message}
                required
              >
                <Input
                  id="password-confirm"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={
                    passwordForm.formState.errors.password_confirmation
                      ? true
                      : undefined
                  }
                  {...passwordForm.register('password_confirmation')}
                />
              </Field>

              <Button type="submit" disabled={passwordMutation.isPending}>
                {passwordMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Updating…
                  </>
                ) : (
                  'Update password'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
