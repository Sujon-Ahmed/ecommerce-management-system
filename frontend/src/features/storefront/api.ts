import { apiGet } from '@/lib/api'
import type { PaginationMeta, QueryParams } from '@/types/api'
import type { StorefrontProduct, StorefrontShop } from '@/types/models'

export function listStorefrontShops(): Promise<StorefrontShop[]> {
  return apiGet<StorefrontShop[]>('/storefront/shops').then((res) => res.data)
}

export function getStorefrontShop(slug: string): Promise<StorefrontShop> {
  return apiGet<StorefrontShop>(`/storefront/shops/${slug}`).then(
    (res) => res.data,
  )
}

export function listStorefrontProducts(
  slug: string,
  params: QueryParams,
): Promise<{ items: StorefrontProduct[]; meta?: PaginationMeta }> {
  return apiGet<StorefrontProduct[]>(
    `/storefront/shops/${slug}/products`,
    params,
  ).then((res) => ({ items: res.data, meta: res.meta }))
}

export function getStorefrontProduct(
  slug: string,
  productSlug: string,
): Promise<StorefrontProduct> {
  return apiGet<StorefrontProduct>(
    `/storefront/shops/${slug}/products/${productSlug}`,
  ).then((res) => res.data)
}
