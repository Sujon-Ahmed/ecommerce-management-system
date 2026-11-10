export type Role = 'admin' | 'shop_owner' | 'customer'

export interface User {
  id: number
  name: string
  email: string
  phone: string | null
  is_active: boolean
  roles: Role[]
  shops?: Shop[]
  shops_count?: number
  created_at: string | null
  updated_at: string | null
}

export interface Shop {
  id: number
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  status: 'active' | 'inactive'
  owners?: User[]
  owners_count?: number
  shop_products_count?: number
  created_at: string | null
  updated_at: string | null
}

export interface Product {
  id: number
  name: string
  slug: string
  sku: string
  description: string | null
  category: string | null
  thumbnail_url: string | null
  is_active: boolean
  created_by?: User
  shops_count?: number
  shop_products_count?: number
  shop_products?: ShopProduct[]
  created_at: string | null
  updated_at: string | null
}

export interface ShopProduct {
  id: number
  shop_id: number
  product_id: number
  product?: Product
  shop?: Shop
  price: string
  description: string | null
  thumbnail_url: string | null
  effective_thumbnail_url: string | null
  stock: number
  in_stock: boolean
  status: 'active' | 'inactive'
  created_at: string | null
  updated_at: string | null
}

export interface CatalogProduct {
  id: number
  name: string
  slug: string
  sku: string
  description: string | null
  category: string | null
  thumbnail_url: string | null
  is_active: boolean
  assigned: boolean
  shop_product_id: number | null
  created_at: string | null
  updated_at: string | null
}

export interface AdminStats {
  shops: { total: number; active: number; inactive: number }
  products: { total: number; active: number }
  shop_owners: number
  assignments: number
}

export interface AdminDashboardData {
  stats: AdminStats
  recent_shops: Shop[]
  recent_products: Product[]
}

export interface ShopOwnerStats {
  listings: {
    total: number
    active: number
    inactive: number
    in_stock: number
    out_of_stock: number
  }
  catalog: { available: number }
}

export interface ShopOwnerDashboardData {
  shop: Shop
  stats: ShopOwnerStats
}

export interface StorefrontShop {
  id: number
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  products_count: number
  created_at: string | null
}

export interface StorefrontProduct {
  id: number
  shop_product_id: number
  name: string
  slug: string
  sku: string
  category: string | null
  price: string
  description: string | null
  thumbnail_url: string | null
  stock: number
  in_stock: boolean
  created_at: string | null
}
