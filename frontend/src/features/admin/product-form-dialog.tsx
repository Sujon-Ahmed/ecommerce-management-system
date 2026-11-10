import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Field } from '@/components/form/field'
import { ImageUpload } from '@/components/form/image-upload'
import { SwitchField } from '@/components/form/switch-field'
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
  createProduct,
  updateProduct,
  type ProductValues,
} from '@/features/admin/api'
import { applyFieldErrors, errorMessage } from '@/lib/errors'
import type { Product } from '@/types/models'

const productSchema = z.object({
  name: z.string().trim().min(2, 'Enter the product name').max(255),
  sku: z.string().trim().min(1, 'Enter a SKU').max(100),
  description: z.string().max(5000),
  category: z.string().max(100),
  is_active: z.boolean(),
})

type ProductFormValues = z.infer<typeof productSchema>

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
}: ProductFormDialogProps) {
  const queryClient = useQueryClient()
  const [thumbnail, setThumbnail] = useState<File | null>(null)
  const [removeThumbnail, setRemoveThumbnail] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      description: '',
      category: '',
      is_active: true,
    },
  })

  const isActive = watch('is_active')

  useEffect(() => {
    if (!open) {
      return
    }

    setThumbnail(null)
    setRemoveThumbnail(false)
    setFormError(null)
    setImageError(null)
    reset({
      name: product?.name ?? '',
      sku: product?.sku ?? '',
      description: product?.description ?? '',
      category: product?.category ?? '',
      is_active: product?.is_active ?? true,
    })
  }, [open, product, reset])

  const mutation = useMutation({
    mutationFn: (values: ProductValues) =>
      product
        ? updateProduct(product.id, values, thumbnail, removeThumbnail)
        : createProduct(values, thumbnail),
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'shop-products'] })
      void queryClient.invalidateQueries({ queryKey: ['storefront'] })
      toast.success(product ? 'Product updated' : 'Product created', {
        description: `${saved.name} (${saved.sku})`,
      })
      onOpenChange(false)
    },
    onError: (error) => {
      const apiError = applyFieldErrors(error, setError)
      setFormError(
        Object.keys(apiError.fieldErrors).length > 0 ? null : apiError.message,
      )
      setImageError(apiError.fieldErrors.thumbnail?.[0] ?? null)
      toast.error(errorMessage(error))
    },
  })

  function onSubmit(values: ProductFormValues) {
    setFormError(null)
    setImageError(null)
    mutation.mutate(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{product ? 'Edit product' : 'New catalog product'}</DialogTitle>
          <DialogDescription>
            {product
              ? 'Changes here update the shared catalog. Shop owners can still override price, stock, description, and image for their shop.'
              : 'Add a product to the shared catalog. You can assign it to shops afterwards or leave that to shop owners.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {formError ? <Alert tone="destructive">{formError}</Alert> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="product-name" error={errors.name?.message} required>
              <Input
                id="product-name"
                placeholder="Wireless Earbuds"
                aria-invalid={errors.name ? true : undefined}
                {...register('name')}
              />
            </Field>
            <Field
              label="SKU"
              htmlFor="product-sku"
              error={errors.sku?.message}
              hint="Must be unique across the catalog."
              required
            >
              <Input
                id="product-sku"
                placeholder="AUD-EB-001"
                aria-invalid={errors.sku ? true : undefined}
                {...register('sku')}
              />
            </Field>
            <Field label="Category" htmlFor="product-category" error={errors.category?.message}>
              <Input
                id="product-category"
                placeholder="Electronics"
                aria-invalid={errors.category ? true : undefined}
                {...register('category')}
              />
            </Field>
          </div>

          <Field
            label="Description"
            htmlFor="product-description"
            error={errors.description?.message}
          >
            <Textarea
              id="product-description"
              rows={4}
              placeholder="Describe the product for shop owners and customers."
              aria-invalid={errors.description ? true : undefined}
              {...register('description')}
            />
          </Field>

          <SwitchField
            id="product-active"
            label="Catalog active"
            description="Inactive products disappear from the catalog and all storefronts."
            checked={isActive}
            onCheckedChange={(checked) =>
              setValue('is_active', checked, { shouldDirty: true })
            }
          />

          <ImageUpload
            label="Thumbnail"
            value={thumbnail}
            onChange={(file) => {
              setThumbnail(file)
              setImageError(null)

              if (file) {
                setRemoveThumbnail(false)
              }
            }}
            existingUrl={removeThumbnail ? null : product?.thumbnail_url}
            onRemoveExisting={() => setRemoveThumbnail(true)}
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
              ) : product ? (
                'Save changes'
              ) : (
                'Create product'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
