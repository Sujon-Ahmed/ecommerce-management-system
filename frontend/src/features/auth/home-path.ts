import type { User } from '@/types/models'

export function homePathFor(user: User | null): string {
  if (!user) {
    return '/login'
  }

  if (user.roles.includes('admin')) {
    return '/admin'
  }

  if (user.roles.includes('shop_owner')) {
    return '/shop-owner'
  }

  return '/account'
}
