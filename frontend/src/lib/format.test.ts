import { describe, expect, it } from 'vitest'
import { homePathFor } from '@/features/auth/home-path'
import { initials, titleCase } from '@/lib/format'
import type { User } from '@/types/models'

function userWithRoles(roles: User['roles']): User {
  return {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    phone: null,
    is_active: true,
    roles,
    created_at: null,
    updated_at: null,
  }
}

describe('homePathFor', () => {
  it('sends guests to the login page', () => {
    expect(homePathFor(null)).toBe('/login')
  })

  it('sends administrators to the admin dashboard', () => {
    expect(homePathFor(userWithRoles(['admin']))).toBe('/admin')
  })

  it('sends shop owners to the shop-owner dashboard', () => {
    expect(homePathFor(userWithRoles(['shop_owner']))).toBe('/shop-owner')
  })

  it('falls back to the account page for other roles', () => {
    expect(homePathFor(userWithRoles(['customer']))).toBe('/account')
  })
})

describe('format helpers', () => {
  it('builds initials from the first two words', () => {
    expect(initials('Dhaka Fashion House')).toBe('DF')
  })

  it('title-cases snake_case values', () => {
    expect(titleCase('shop_owner')).toBe('Shop Owner')
  })
})
