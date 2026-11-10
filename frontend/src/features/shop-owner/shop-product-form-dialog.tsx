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
import {
  createShopProduct,
  updateShopProduct,
  type NewShopProductValues,
  type UpdateShopProductValues,
} from '@/features/shop-owner/api'
import { useShopContext } from '@/features/shop-owner/shop-context'
import { applyFieldErrors, errorMessage } from '@/lib/errors'
import type { ShopProduct } from '@/types/models'

const listingSchema = z.object({
  name: z.string().trim().min(2, 'Enter the product name').max(255),
  sku: z.string().trim().min(1, 'Enter a SKU').max(100),
  description: z.string().max(5000),
  category: z.string().max(100),
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

type ListingFormValues = z.infer<typeof listingSchema>

interface ShopProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  listing: ShopProduct | null
}

export function ShopProductFormDialog({
  open,
  onOpenChange,
  listing,
}: ShopProductFormDialogProps) {
  const queryClient = useQueryClient()
  const { selectedShop, requestConfig } = useShopContext()
  const isCreate = listing === null
  const [catalogThumbnail, setCatalogThumbnail] = useState<File | null>(null)
  const [shopThumbnail, setShopThumbnail] = useState<File | null>(null)
  const [removeOverride, setRemoveOverride] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [catalogImageError, setCatalogImageError] = useState<string | null>(null)
  const [shopImageError, setShopImageError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      name: '',
      sku: '',
      description: '',
      category: '',
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

    setCatalogThumbnail(null)
    setShopThumbnail(null)
    setRemoveOverride(false)
    setFormError(null)
    setCatalogImageError(null)
    setShopImageError(null)
    reset({
      name: listing?.product?.name ?? '',
      sku: listing?.product?.sku ?? '',
      description: listing?.product?.description ?? '',
      category: listing?.product?.category ?? '',
      price: listing?.price ?? '',
      stock: String(listing?.stock ?? 0),
      shop_description: listing?.description ?? '',
      shop_status: listing?.status ?? 'active',
    })
  }, [open, listing, reset])

  const mutation = useMutation({
    mutationFn: (values: ListingFormValues) => {
      if (isCreate) {
        const payload: NewShopProductValues = {
          name: values.name,
          sku: values.sku,
          description: values.description,
          category: values.category,
          price: values.price,
          stock: values.stock,
          shop_description: values.shop_description,
          shop_status: values.shop_status,
        }

        return createShopProduct(
          requestConfig,
          payload,
          catalogThumbnail,
          shopThumbnail,
        )
      }

      const payload: UpdateShopProductValues = {
        price: values.price,
        stock: values.stock,
        shop_description: values.shop_description,
        shop_status: values.shop_status,
      }

      return updateShopProduct(
        requestConfig,
        listing.product_id,
        payload,
        shopThumbnail,
        removeOverride,
      )
    },
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ['shop-owner'] })
      toast.success(isCreate ? 'Product created and listed' : 'Listing updated', {
        description: saved.product?.name ?? 'Your storefront is up to date.',
      })
      onOpenChange(false)
    },
    onError: (error) => {
      const apiError = applyFieldErrors(error, setError)
      setFormError(
        Object.keys(apiError.fieldErrors).length > 0 ? null : apiError.message,
      )
      setCatalogImageError(apiError.fieldErrors.thumbnail?.[0] ?? null)
      setShopImageError(apiError.fieldErrors.shop_thumbnail?.[0] ?? null)
      toast.error(errorMessage(error))
    },
  })

  function onSubmit(values: ListingFormValues) {
    setFormError(null)
    setCatalogImageError(null)
    setShopImageError(null)
    mutation.mutate(values)
  }

  const effectivePreview =
    listing?.thumbnail_url ?? listing?.effective_thumbnail_url ?? null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isCreate ? 'New product for your shop' : 'Edit listing'}
          </DialogTitle>
          <DialogDescription>
            {isCreate
              ? `This creates a catalog product and assigns it to ${selectedShop.name} in one step.`
              : `These overrides apply only to ${selectedShop.name}. Other shops keep their own values.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {formError ? <Alert tone="destructive">{formError}</Alert> : null}

          {isCreate ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name" htmlFor="listing-name" error={errors.name?.message} required>
                  <Input
                    id="listing-name"
                    placeholder="Wireless Earbuds"
                    aria-invalid={errors.name ? true : undefined}
                    {...register('name')}
                  />
                </Field>
                <Field
                  label="SKU"
                  htmlFor="listing-sku"
                  error={errors.sku?.message}
                  hint="Must be unique across the catalog."
                  required
                >
                  <Input
                    id="listing-sku"
                    placeholder="AUD-EB-001"
                    aria-invalid={errors.sku ? true : undefined}
                    {...register('sku')}
                  />
                </Field>
                <Field label="Category" htmlFor="listing-category" error={errors.category?.message}>
                  <Input
                    id="listing-category"
                    placeholder="Electronics"
                    aria-invalid={errors.category ? true : undefined}
                    {...register('category')}
                  />
                </Field>
              </div>

              <Field
                label="Catalog description"
                htmlFor="listing-description"
                error={errors.description?.message}
                hint="Shared with the catalog. Your shop description can override it below."
              >
                <Textarea
                  id="listing-description"
                  rows={3}
                  aria-invalid={errors.description ? true : undefined}
                  {...register('description')}
                />
              </Field>
            </>
          ) : (
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <p className="font-medium">{listing.product?.name}</p>
              <p className="text-xs text-muted-foreground">
                {listing.product?.sku}
                {listing.product?.category ? ` · ${listing.product.category}` : ''}
              </p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your price (BDT)" htmlFor="listing-price" error={errors.price?.message} required>
              <Input
                id="listing-price"
                inputMode="decimal"
                placeholder="0.00"
                aria-invalid={errors.price ? true : undefined}
                {...register('price')}
              />
            </Field>
            <Field label="Stock" htmlFor="listing-stock" error={errors.stock?.message}>
              <Input
                id="listing-stock"
                inputMode="numeric"
                placeholder="0"
                aria-invalid={errors.stock ? true : undefined}
                {...register('stock')}
              />
            </Field>
          </div>

          <Field
            label="Shop description"
            htmlFor="listing-shop-description"
            error={errors.shop_description?.message}
            hint="Optional. Overrides the catalog description on your storefront."
          >
            <Textarea
              id="listing-shop-description"
              rows={3}
              aria-invalid={errors.shop_description ? true : undefined}
              {...register('shop_description')}
            />
          </Field>

          <SelectField
            control={control}
            name="shop_status"
            label="Listing status"
            id="listing-status"
            options={[
              { value: 'active', label: 'Active — visible on your storefront' },
              { value: 'inactive', label: 'Inactive — hidden from customers' },
            ]}
            error={errors.shop_status?.message}
          />

          {isCreate ? (
            <ImageUpload
              label="Catalog thumbnail"
              value={catalogThumbnail}
              onChange={(file) => {
                setCatalogThumbnail(file)
                setCatalogImageError(null)
              }}
              error={catalogImageError ?? undefined}
              hint="Optional. Shared with the catalog. JPG, PNG or WebP up to 2 MB."
            />
          ) : null}

          <ImageUpload
            label="Shop thumbnail override"
            value={shopThumbnail}
            onChange={(file) => {
              setShopThumbnail(file)
              setShopImageError(null)

              if (file) {
                setRemoveOverride(false)
              }
            }}
            existingUrl={removeOverride ? null : effectivePreview}
            onRemoveExisting={() => setRemoveOverride(true)}
            error={shopImageError ?? undefined}
            hint={
              isCreate
                ? 'Optional. Used only on your storefront; falls back to the catalog thumbnail.'
                : 'Optional. Removing this falls back to the catalog thumbnail.'
            }
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
              ) : isCreate ? (
                'Create and list'
              ) : (
                'Save listing'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
