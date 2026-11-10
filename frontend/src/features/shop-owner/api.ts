import type { AxiosRequestConfig } from 'axios'
import { apiDelete, apiGet, apiPost } from '@/lib/api'
import { toFormData } from '@/lib/form-data'
import type { PaginationMeta, QueryParams } from '@/types/api'
import type {
  CatalogProduct,
  Shop,
  ShopOwnerDashboardData,
  ShopProduct,
} from '@/types/models'

export interface ShopOwnerList<T> {
  items: T[]
  meta?: PaginationMeta
}

export function getShopOwnerDashboard(
  config: AxiosRequestConfig,
): Promise<ShopOwnerDashboardData> {
  return apiGet<ShopOwnerDashboardData>(
    '/shop-owner/dashboard',
    undefined,
    config,
  ).then((res) => res.data)
}

export function getShopOwnerShop(config: AxiosRequestConfig): Promise<Shop> {
  return apiGet<Shop>('/shop-owner/shop', undefined, config).then(
    (res) => res.data,
  )
}

export function listCatalog(
  config: AxiosRequestConfig,
  params: QueryParams,
): Promise<ShopOwnerList<CatalogProduct>> {
  return apiGet<CatalogProduct[]>('/shop-owner/catalog', params, config).then(
    (res) => ({ items: res.data, meta: res.meta }),
  )
}

export function getCatalogProduct(
  config: AxiosRequestConfig,
  productId: number,
): Promise<CatalogProduct> {
  return apiGet<CatalogProduct>(
    `/shop-owner/catalog/${productId}`,
    undefined,
    config,
  ).then((res) => res.data)
}

export interface AssignValues {
  price: string
  stock: string
  shop_description: string
  shop_status: 'active' | 'inactive'
}

export function assignProduct(
  config: AxiosRequestConfig,
  productId: number,
  values: AssignValues,
  thumbnail: File | null,
): Promise<ShopProduct> {
  const form = toFormData({ ...values, shop_thumbnail: thumbnail })

  return apiPost<ShopProduct>(
    `/shop-owner/catalog/${productId}/assign`,
    form,
    config,
  ).then((res) => res.data)
}

export function listShopProducts(
  config: AxiosRequestConfig,
  params: QueryParams,
): Promise<ShopOwnerList<ShopProduct>> {
  return apiGet<ShopProduct[]>('/shop-owner/products', params, config).then(
    (res) => ({ items: res.data, meta: res.meta }),
  )
}

export interface NewShopProductValues {
  name: string
  sku: string
  description: string
  category: string
  price: string
  stock: string
  shop_description: string
  shop_status: 'active' | 'inactive'
}

export function createShopProduct(
  config: AxiosRequestConfig,
  values: NewShopProductValues,
  thumbnail: File | null,
  shopThumbnail: File | null,
): Promise<ShopProduct> {
  const form = toFormData({
    ...values,
    thumbnail,
    shop_thumbnail: shopThumbnail,
  })

  return apiPost<ShopProduct>('/shop-owner/products', form, config).then(
    (res) => res.data,
  )
}

export interface UpdateShopProductValues {
  price: string
  stock: string
  shop_description: string
  shop_status: 'active' | 'inactive'
}

export function updateShopProduct(
  config: AxiosRequestConfig,
  productId: number,
  values: UpdateShopProductValues,
  thumbnail: File | null,
  removeThumbnail: boolean,
): Promise<ShopProduct> {
  const form = toFormData({
    _method: 'PUT',
    ...values,
    shop_thumbnail: thumbnail,
    remove_shop_thumbnail: removeThumbnail || undefined,
  })

  return apiPost<ShopProduct>(
    `/shop-owner/products/${productId}`,
    form,
    config,
  ).then((res) => res.data)
}

export function deleteShopProduct(
  config: AxiosRequestConfig,
  productId: number,
): Promise<void> {
  return apiDelete<null>(`/shop-owner/products/${productId}`, config).then(
    () => undefined,
  )
}
