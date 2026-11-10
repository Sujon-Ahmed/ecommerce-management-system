/* oxlint-disable react/only-export-components */
import type { AxiosRequestConfig } from 'axios'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@/features/auth/auth-context'
import type { Shop } from '@/types/models'

interface ShopContextValue {
  shops: Shop[]
  selectedShop: Shop
  selectedShopId: number
  setSelectedShopId: (id: number) => void
  requestConfig: AxiosRequestConfig
  isInactive: boolean
}

const ShopContext = createContext<ShopContextValue | null>(null)

function storageKey(userId: number): string {
  return `shopsphere.shopId.${userId}`
}

function readStoredShopId(userId: number): number | null {
  try {
    const raw = window.localStorage.getItem(storageKey(userId))

    if (!raw) {
      return null
    }

    const parsed = Number.parseInt(raw, 10)

    return Number.isNaN(parsed) ? null : parsed
  } catch {
    return null
  }
}

function pickDefaultShop(shops: Shop[]): Shop {
  return shops.find((shop) => shop.status === 'active') ?? shops[0]!
}

export function ShopContextProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const shops = useMemo(() => user?.shops ?? [], [user])

  const [selectedShopId, setSelectedShopIdState] = useState<number | null>(() => {
    if (!user || shops.length === 0) {
      return null
    }

    const stored = readStoredShopId(user.id)

    if (stored !== null && shops.some((shop) => shop.id === stored)) {
      return stored
    }

    return pickDefaultShop(shops).id
  })

  const selectedShop = useMemo(
    () => shops.find((shop) => shop.id === selectedShopId) ?? shops[0] ?? null,
    [shops, selectedShopId],
  )

  useEffect(() => {
    if (!user || !selectedShop) {
      return
    }

    if (selectedShopId !== selectedShop.id) {
      setSelectedShopIdState(selectedShop.id)
    }
  }, [user, selectedShop, selectedShopId])

  const setSelectedShopId = useCallback(
    (id: number) => {
      setSelectedShopIdState(id)

      if (user) {
        try {
          window.localStorage.setItem(storageKey(user.id), String(id))
        } catch {
          // Selection still works for the current session.
        }
      }
    },
    [user],
  )

  const value = useMemo<ShopContextValue | null>(() => {
    if (!user || !selectedShop) {
      return null
    }

    return {
      shops,
      selectedShop,
      selectedShopId: selectedShop.id,
      setSelectedShopId,
      requestConfig: {
        headers: { 'X-Shop-Id': String(selectedShop.id) },
      },
      isInactive: selectedShop.status !== 'active',
    }
  }, [user, shops, selectedShop, setSelectedShopId])

  if (!value) {
    return null
  }

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShopContext(): ShopContextValue {
  const context = useContext(ShopContext)

  if (!context) {
    throw new Error('useShopContext must be used inside a ShopContextProvider')
  }

  return context
}

export function useOptionalShopContext(): ShopContextValue | null {
  return useContext(ShopContext)
}
