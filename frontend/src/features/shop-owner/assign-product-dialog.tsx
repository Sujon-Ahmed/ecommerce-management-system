import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { EntityThumb } from '@/components/entity-thumb'
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
import { assignProduct, type AssignValues } from '@/features/shop-owner/api'
import { useShopContext } from '@/features/shop-owner/shop-context'
import { applyFieldErrors, errorMessage } from '@/lib/errors'
import type { CatalogProduct } from '@/types/models'

const assignSchema = z.object({
  price: z
    .string()
    .trim()
    .min(1, 'Enter a price')
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, {
      message: 'Enter a valid price of 0 or more',
    }),
  stock: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === '' ||
        (Number.isInteger(Number(value)) && Number(value) >= 0),
      { message: 'Stock must be a whole number of 0 or more' },
    ),
  shop_description: z.string().max(5000),
  shop_status: z.enum(['active', 'inactive']),
})

type AssignFormValues = z.infer<typeof assignSchema>

interface AssignProductDialogProps {
  product: CatalogProduct | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AssignProductDialog({
  product,
  open,
  onOpenChange,
}: AssignProductDialogProps) {
  const queryClient = useQueryClient()
  const { selectedShop, requestConfig } = useShopContext()
  const [thumbnail, setThumbnail] = useState<File | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<AssignFormValues>({
    resolver: zodResolver(assignSchema),
    defaultValues: {
      price: '',
      stock: '0',
      shop_description: '',
      shop_status: 'active',
    },
  })

  useEffect(() => {
    if (!open) {
      return
    }

    setThumbnail(null)
    setFormError(null)
    setImageError(null)
    reset({
      price: '',
      stock: '0',
      shop_description: '',
      shop_status: 'active',
    })
  }, [open, product, reset])

  const mutation = useMutation({
    mutationFn: (values: AssignValues) =>
      assignProduct(requestConfig, product!.id, values, thumbnail),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['shop-owner'] })
      toast.success('Product added to your shop', {
        description: 'Set your price and stock now, or edit the listing later.',
      })
      onOpenChange(false)
    },
    onError: (error) => {
      const apiError = applyFieldErrors(error, setError)
      setFormError(
        Object.keys(apiError.fieldErrors).length > 0 ? null : apiError.message,
      )
      setImageError(apiError.fieldErrors.shop_thumbnail?.[0] ?? null)
      toast.error(errorMessage(error))
    },
  })

  function onSubmit(values: AssignFormValues) {
    setFormError(null)
    setImageError(null)
    mutation.mutate(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign product to {selectedShop.name}</DialogTitle>
          <DialogDescription>
            This creates a shop listing from the shared catalog product. Your price,
            stock, description, and thumbnail are only used here.
          </DialogDescription>
        </DialogHeader>

        {product ? (
          <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
            <EntityThumb
              src={product.thumbnail_url}
              alt={product.name}
              fallback={product.name}
              className="size-12 rounded-lg text-sm"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{product.name}</p>
              <p className="text-xs text-muted-foreground">
                {product.sku}
                {product.category ? ` · ${product.category}` : ''}
              </p>
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {product.description ?? 'No catalog description provided.'}
              </p>
            </div>
          </div>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {formError ? <Alert tone="destructive">{formError}</Alert> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your price (BDT)" htmlFor="assign-price" error={errors.price?.message} required>
              <Input
                id="assign-price"
                inputMode="decimal"
                placeholder="0.00"
                aria-invalid={errors.price ? true : undefined}
                {...register('price')}
              />
            </Field>
            <Field label="Stock" htmlFor="assign-stock" error={errors.stock?.message}>
              <Input
                id="assign-stock"
                inputMode="numeric"
                placeholder="0"
                aria-invalid={errors.stock ? true : undefined}
                {...register('stock')}
              />
            </Field>
          </div>

          <Field
            label="Shop description"
            htmlFor="assign-description"
            error={errors.shop_description?.message}
            hint="Optional. Overrides the catalog description on your storefront."
          >
            <Textarea
              id="assign-description"
              rows={3}
              placeholder="Describe this product for your customers."
              aria-invalid={errors.shop_description ? true : undefined}
              {...register('shop_description')}
            />
          </Field>

          <SelectField
            control={control}
            name="shop_status"
            label="Listing status"
            id="assign-status"
            options={[
              { value: 'active', label: 'Active — visible on your storefront' },
              { value: 'inactive', label: 'Inactive — hidden from customers' },
            ]}
            error={errors.shop_status?.message}
          />

          <ImageUpload
            label="Shop thumbnail"
            value={thumbnail}
            onChange={(file) => {
              setThumbnail(file)
              setImageError(null)
            }}
            existingUrl={product?.thumbnail_url}
            error={imageError ?? undefined}
            hint="Optional. Falls back to the catalog thumbnail."
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
                  Assigning…
                </>
              ) : (
                'Assign product'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
