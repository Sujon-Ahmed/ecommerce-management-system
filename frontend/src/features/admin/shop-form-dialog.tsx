import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Field } from '@/components/form/field'
import { ImageUpload } from '@/components/form/image-upload'
import { SelectField } from '@/components/form/select-field'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createShop, updateShop, type ShopValues } from '@/features/admin/api'
import { applyFieldErrors, errorMessage } from '@/lib/errors'
import type { Shop } from '@/types/models'

const shopSchema = z.object({
  name: z.string().trim().min(2, 'Enter the shop name').max(255),
  slug: z
    .string()
    .trim()
    .max(255)
    .regex(/^[a-z0-9-]*$/, 'Use lowercase letters, numbers, and hyphens only'),
  description: z.string().max(2000),
  status: z.enum(['active', 'inactive']),
})

type ShopFormValues = z.infer<typeof shopSchema>

interface ShopFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shop: Shop | null
}

export function ShopFormDialog({ open, onOpenChange, shop }: ShopFormDialogProps) {
  const queryClient = useQueryClient()
  const [logo, setLogo] = useState<File | null>(null)
  const [removeLogo, setRemoveLogo] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ShopFormValues>({
    resolver: zodResolver(shopSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      status: 'active',
    },
  })

  useEffect(() => {
    if (!open) {
      return
    }

    setLogo(null)
    setRemoveLogo(false)
    setFormError(null)
    setImageError(null)
    reset({
      name: shop?.name ?? '',
      slug: shop?.slug ?? '',
      description: shop?.description ?? '',
      status: shop?.status ?? 'active',
    })
  }, [open, shop, reset])

  const mutation = useMutation({
    mutationFn: (values: ShopValues) =>
      shop
        ? updateShop(shop.id, values, logo, removeLogo)
        : createShop(values, logo),
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'shops'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      void queryClient.invalidateQueries({ queryKey: ['storefront'] })
      toast.success(shop ? 'Shop updated' : 'Shop created', {
        description: `${saved.name} is ready.`,
      })
      onOpenChange(false)
    },
    onError: (error) => {
      const apiError = applyFieldErrors(error, setError)
      setFormError(
        Object.keys(apiError.fieldErrors).length > 0 ? null : apiError.message,
      )
      setImageError(apiError.fieldErrors.logo?.[0] ?? null)
      toast.error(errorMessage(error))
    },
  })

  function onSubmit(values: ShopFormValues) {
    setFormError(null)
    setImageError(null)
    mutation.mutate(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{shop ? 'Edit shop' : 'New shop'}</DialogTitle>
          <DialogDescription>
            {shop
              ? 'Update the storefront profile. Inactive shops disappear from the public storefront.'
              : 'Create a shop and assign owners after saving.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {formError ? <Alert tone="destructive">{formError}</Alert> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="shop-name" error={errors.name?.message} required>
              <Input
                id="shop-name"
                placeholder="Dhaka Gadget Hub"
                aria-invalid={errors.name ? true : undefined}
                {...register('name')}
              />
            </Field>

            <Field
              label="Slug"
              htmlFor="shop-slug"
              error={errors.slug?.message}
              hint="Leave blank to generate one from the name."
            >
              <Input
                id="shop-slug"
                placeholder="dhaka-gadget-hub"
                aria-invalid={errors.slug ? true : undefined}
                {...register('slug')}
              />
            </Field>
          </div>

          <Field
            label="Description"
            htmlFor="shop-description"
            error={errors.description?.message}
          >
            <Textarea
              id="shop-description"
              rows={3}
              placeholder="What does this shop sell?"
              aria-invalid={errors.description ? true : undefined}
              {...register('description')}
            />
          </Field>

          <SelectField
            control={control}
            name="status"
            label="Status"
            id="shop-status"
            options={[
              { value: 'active', label: 'Active — visible on the storefront' },
              { value: 'inactive', label: 'Inactive — hidden from customers' },
            ]}
            error={errors.status?.message}
          />

          <ImageUpload
            label="Logo"
            value={logo}
            onChange={(file) => {
              setLogo(file)
              setImageError(null)

              if (file) {
                setRemoveLogo(false)
              }
            }}
            existingUrl={removeLogo ? null : shop?.logo_url}
            onRemoveExisting={() => setRemoveLogo(true)}
            error={imageError ?? undefined}
          />

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
              ) : shop ? (
                'Save changes'
              ) : (
                'Create shop'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
