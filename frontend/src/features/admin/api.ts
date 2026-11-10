import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api'
import { toFormData } from '@/lib/form-data'
import type { QueryParams } from '@/types/api'
import type {
  AdminDashboardData,
  Product,
  Shop,
  ShopProduct,
  User,
} from '@/types/models'

export function getAdminDashboard(): Promise<AdminDashboardData> {
  return apiGet<AdminDashboardData>('/admin/dashboard').then((res) => res.data)
}

export function listShops(params: QueryParams): Promise<{
  items: Shop[]
  meta?: import('@/types/api').PaginationMeta
}> {
  return apiGet<Shop[]>('/admin/shops', params).then((res) => ({
    items: res.data,
    meta: res.meta,
  }))
}

export function listShopOptions(): Promise<Shop[]> {
  return apiGet<Shop[]>('/admin/shops', { per_page: 100 }).then(
    (res) => res.data,
  )
}

export function getShop(id: number): Promise<Shop> {
  return apiGet<Shop>(`/admin/shops/${id}`).then((res) => res.data)
}

export interface ShopValues {
  name: string
  slug: string
  description: string
  status: 'active' | 'inactive'
}

export function createShop(values: ShopValues, logo: File | null): Promise<Shop> {
  const form = toFormData({ ...values, logo })
  return apiPost<Shop>('/admin/shops', form).then((res) => res.data)
}

export function updateShop(
  id: number,
  values: ShopValues,
  logo: File | null,
  removeLogo: boolean,
): Promise<Shop> {
  const form = toFormData({
    _method: 'PUT',
    ...values,
    logo,
    remove_logo: removeLogo || undefined,
  })
  return apiPost<Shop>(`/admin/shops/${id}`, form).then((res) => res.data)
}

export function deleteShop(id: number): Promise<void> {
  return apiDelete<null>(`/admin/shops/${id}`).then(() => undefined)
}

export function listShopProducts(
  shopId: number,
  params: QueryParams,
): Promise<{
  items: ShopProduct[]
  meta?: import('@/types/api').PaginationMeta
}> {
  return apiGet<ShopProduct[]>(`/admin/shops/${shopId}/products`, params).then(
    (res) => ({ items: res.data, meta: res.meta }),
  )
}

export function listShopOwners(params: QueryParams): Promise<{
  items: User[]
  meta?: import('@/types/api').PaginationMeta
}> {
  return apiGet<User[]>('/admin/shop-owners', params).then((res) => ({
    items: res.data,
    meta: res.meta,
  }))
}

export interface ShopOwnerValues {
  name: string
  email: string
  phone: string
  is_active: boolean
  shop_ids: number[]
  password?: string
  password_confirmation?: string
}

export function createShopOwner(values: ShopOwnerValues): Promise<User> {
  return apiPost<User>('/admin/shop-owners', values).then((res) => res.data)
}

export function updateShopOwner(
  id: number,
  values: ShopOwnerValues,
): Promise<User> {
  return apiPut<User>(`/admin/shop-owners/${id}`, values).then(
    (res) => res.data,
  )
}

export function deleteShopOwner(id: number): Promise<void> {
  return apiDelete<null>(`/admin/shop-owners/${id}`).then(() => undefined)
}

export function listProducts(params: QueryParams): Promise<{
  items: Product[]
  meta?: import('@/types/api').PaginationMeta
}> {
  return apiGet<Product[]>('/admin/products', params).then((res) => ({
    items: res.data,
    meta: res.meta,
  }))
}

export function getProduct(id: number): Promise<Product> {
  return apiGet<Product>(`/admin/products/${id}`).then((res) => res.data)
}

export interface ProductValues {
  name: string
  sku: string
  description: string
  category: string
  is_active: boolean
}

export function createProduct(
  values: ProductValues,
  thumbnail: File | null,
): Promise<Product> {
  const form = toFormData({ ...values, thumbnail })
  return apiPost<Product>('/admin/products', form).then((res) => res.data)
}

export function updateProduct(
  id: number,
  values: ProductValues,
  thumbnail: File | null,
  removeThumbnail: boolean,
): Promise<Product> {
  const form = toFormData({
    _method: 'PUT',
    ...values,
    thumbnail,
    remove_thumbnail: removeThumbnail || undefined,
  })
  return apiPost<Product>(`/admin/products/${id}`, form).then((res) => res.data)
}

export function deleteProduct(id: number): Promise<void> {
  return apiDelete<null>(`/admin/products/${id}`).then(() => undefined)
}
