import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Field } from '@/components/form/field'
import { SwitchField } from '@/components/form/switch-field'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  createShopOwner,
  listShopOptions,
  updateShopOwner,
  type ShopOwnerValues,
} from '@/features/admin/api'
import { applyFieldErrors, errorMessage } from '@/lib/errors'
import { formatCount } from '@/lib/format'
import type { User } from '@/types/models'

function buildSchema(requirePassword: boolean) {
  return z
    .object({
      name: z.string().trim().min(2, 'Enter the owner’s name').max(255),
      email: z.email('Enter a valid email address'),
      phone: z.string().max(30),
      password: z.string(),
      password_confirmation: z.string(),
      is_active: z.boolean(),
      shop_ids: z.array(z.number()),
    })
    .superRefine((values, ctx) => {
      const hasPassword = values.password.length > 0

      if (!hasPassword) {
        if (requirePassword) {
          ctx.addIssue({
            code: 'custom',
            path: ['password'],
            message: 'Set an initial password for this owner',
          })
        }

        return
      }

      if (values.password.length < 8) {
        ctx.addIssue({
          code: 'custom',
          path: ['password'],
          message: 'Use at least 8 characters',
        })
      }

      if (!/[A-Za-z]/.test(values.password) || !/\d/.test(values.password)) {
        ctx.addIssue({
          code: 'custom',
          path: ['password'],
          message: 'Include at least one letter and one number',
        })
      }

      if (values.password !== values.password_confirmation) {
        ctx.addIssue({
          code: 'custom',
          path: ['password_confirmation'],
          message: 'Passwords do not match',
        })
      }
    })
}

type ShopOwnerFormValues = z.infer<ReturnType<typeof buildSchema>>

interface ShopOwnerFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  owner: User | null
}

export function ShopOwnerFormDialog({
  open,
  onOpenChange,
  owner,
}: ShopOwnerFormDialogProps) {
  const queryClient = useQueryClient()
  const [formError, setFormError] = useState<string | null>(null)
  const [shopListError, setShopListError] = useState<string | null>(null)

  const schema = useMemo(() => buildSchema(owner === null), [owner])

  const shopsQuery = useQuery({
    queryKey: ['admin', 'shop-options'],
    queryFn: listShopOptions,
    enabled: open,
    staleTime: 60_000,
  })

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ShopOwnerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      password_confirmation: '',
      is_active: true,
      shop_ids: [],
    },
  })

  const selectedShopIds = watch('shop_ids')
  const isActive = watch('is_active')

  useEffect(() => {
    if (!open) {
      return
    }

    setFormError(null)
    setShopListError(null)
    reset({
      name: owner?.name ?? '',
      email: owner?.email ?? '',
      phone: owner?.phone ?? '',
      password: '',
      password_confirmation: '',
      is_active: owner?.is_active ?? true,
      shop_ids: owner?.shops?.map((shop) => shop.id) ?? [],
    })
  }, [open, owner, reset])

  const mutation = useMutation({
    mutationFn: (values: ShopOwnerValues) =>
      owner ? updateShopOwner(owner.id, values) : createShopOwner(values),
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'shop-owners'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'shops'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      toast.success(owner ? 'Shop owner updated' : 'Shop owner created', {
        description: saved.name,
      })
      onOpenChange(false)
    },
    onError: (error) => {
      const apiError = applyFieldErrors(error, setError)
      setFormError(
        Object.keys(apiError.fieldErrors).length > 0 ? null : apiError.message,
      )
      setShopListError(apiError.fieldErrors.shop_ids?.[0] ?? null)
      toast.error(errorMessage(error))
    },
  })

  function onSubmit(values: ShopOwnerFormValues) {
    setFormError(null)
    setShopListError(null)

    const payload: ShopOwnerValues = {
      name: values.name,
      email: values.email,
      phone: values.phone,
      is_active: values.is_active,
      shop_ids: values.shop_ids,
    }

    if (values.password) {
      payload.password = values.password
      payload.password_confirmation = values.password_confirmation
    }

    mutation.mutate(payload)
  }

  function toggleShop(shopId: number, checked: boolean) {
    const next = checked
      ? [...selectedShopIds, shopId]
      : selectedShopIds.filter((id) => id !== shopId)

    setValue('shop_ids', next, { shouldDirty: true })
  }

  const shops = shopsQuery.data ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{owner ? 'Edit shop owner' : 'New shop owner'}</DialogTitle>
          <DialogDescription>
            Owners can only manage the shops assigned here. They cannot change shop
            settings or other accounts.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {formError ? <Alert tone="destructive">{formError}</Alert> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="owner-name" error={errors.name?.message} required>
              <Input
                id="owner-name"
                placeholder="Rafiq Ahmed"
                aria-invalid={errors.name ? true : undefined}
                {...register('name')}
              />
            </Field>
            <Field label="Email" htmlFor="owner-email" error={errors.email?.message} required>
              <Input
                id="owner-email"
                type="email"
                autoComplete="email"
                placeholder="owner@example.com"
                aria-invalid={errors.email ? true : undefined}
                {...register('email')}
              />
            </Field>
            <Field label="Phone" htmlFor="owner-phone" error={errors.phone?.message}>
              <Input
                id="owner-phone"
                placeholder="+88017…"
                aria-invalid={errors.phone ? true : undefined}
                {...register('phone')}
              />
            </Field>
            <Field
              label={owner ? 'New password' : 'Password'}
              htmlFor="owner-password"
              error={errors.password?.message}
              hint={
                owner
                  ? 'Leave blank to keep the current password.'
                  : 'At least 8 characters with letters and numbers.'
              }
              required={!owner}
            >
              <Input
                id="owner-password"
                type="password"
                autoComplete="new-password"
                aria-invalid={errors.password ? true : undefined}
                {...register('password')}
              />
            </Field>
            <Field
              label="Confirm password"
              htmlFor="owner-password-confirmation"
              error={errors.password_confirmation?.message}
            >
              <Input
                id="owner-password-confirmation"
                type="password"
                autoComplete="new-password"
                aria-invalid={errors.password_confirmation ? true : undefined}
                {...register('password_confirmation')}
              />
            </Field>
          </div>

          <SwitchField
            id="owner-active"
            label="Account active"
            description="Inactive owners cannot sign in or manage their shops."
            checked={isActive}
            onCheckedChange={(checked) =>
              setValue('is_active', checked, { shouldDirty: true })
            }
          />

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Assigned shops</legend>
            <p className="text-xs text-muted-foreground">
              Pick at least one shop. Owners with multiple shops can switch context
              after signing in.
            </p>

            {shopListError ? (
              <p role="alert" className="text-xs font-medium text-destructive">
                {shopListError}
              </p>
            ) : null}

            <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border p-2">
              {shopsQuery.isPending ? (
                <div className="space-y-2 p-1">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : shops.length > 0 ? (
                shops.map((shop) => {
                  const checked = selectedShopIds.includes(shop.id)
                  const inputId = `owner-shop-${shop.id}`

                  return (
                    <div
                      key={shop.id}
                      className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/60"
                    >
                      <Checkbox
                        id={inputId}
                        checked={checked}
                        onCheckedChange={(value) => toggleShop(shop.id, value === true)}
                      />
                      <label htmlFor={inputId} className="min-w-0 flex-1 text-sm">
                        <span className="block truncate">{shop.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          /{shop.slug} · {formatCount(shop.shop_products_count)} products
                        </span>
                      </label>
                      {shop.status !== 'active' ? (
                        <span className="text-xs text-muted-foreground">inactive</span>
                      ) : null}
                    </div>
                  )
                })
              ) : (
                <p className="px-2 py-3 text-sm text-muted-foreground">
                  No shops exist yet. Create a shop first.
                </p>
              )}
            </div>
          </fieldset>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Saving…
                </>
              ) : owner ? (
                'Save changes'
              ) : (
                'Create owner'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
