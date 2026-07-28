import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase, type CartItem, type ProductVariant, type Product } from '../lib/supabase'
import { useAuth } from './AuthContext'

export type LocalCartItem = {
  variant_id: string
  quantity: number
  variant: ProductVariant & { product?: Product }
}

type CartContextType = {
  items: (CartItem | LocalCartItem)[]
  loading: boolean
  itemCount: number
  subtotal: number
  addToCart: (variantId: string, quantity?: number) => Promise<void>
  updateQuantity: (variantId: string, quantity: number) => Promise<void>
  removeFromCart: (variantId: string) => Promise<void>
  clearCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const LOCAL_STORAGE_KEY = 'bm_cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [items, setItems] = useState<(CartItem | LocalCartItem)[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session) {
      mergeLocalCartToServer()
    } else {
      loadLocalCart()
    }
  }, [session])

  async function mergeLocalCartToServer() {
    setLoading(true)
    // Check for local cart items to merge
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
    let localItems: LocalCartItem[] = []
    if (stored) {
      try { localItems = JSON.parse(stored) } catch { localItems = [] }
    }

    // Merge local items into server cart
    for (const item of localItems) {
      const { data: existing } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', session!.user.id)
        .eq('variant_id', item.variant_id)
        .maybeSingle()

      if (existing) {
        await supabase
          .from('cart_items')
          .update({ quantity: (existing as CartItem).quantity + item.quantity })
          .eq('id', (existing as CartItem).id)
      } else {
        await supabase
          .from('cart_items')
          .insert({ user_id: session!.user.id, variant_id: item.variant_id, quantity: item.quantity })
      }
    }

    // Clear local cart after merge
    if (localItems.length > 0) {
      localStorage.removeItem(LOCAL_STORAGE_KEY)
    }

    // Load merged server cart
    const { data } = await supabase
      .from('cart_items')
      .select('*, variant:product_variants(*, product:products(*))')
      .eq('user_id', session!.user.id)

    setItems((data as CartItem[]) ?? [])
    setLoading(false)
  }

  function loadLocalCart() {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (stored) {
      try {
        setItems(JSON.parse(stored))
      } catch {
        setItems([])
      }
    } else {
      setItems([])
    }
    setLoading(false)
  }

  function saveLocalCart(cartItems: LocalCartItem[]) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cartItems))
  }

  async function fetchVariant(variantId: string): Promise<(ProductVariant & { product?: Product }) | null> {
    const { data } = await supabase
      .from('product_variants')
      .select('*, product:products(*)')
      .eq('id', variantId)
      .maybeSingle()
    return data as (ProductVariant & { product?: Product }) | null
  }

  async function addToCart(variantId: string, quantity = 1) {
    if (session) {
      const { data: existing } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('variant_id', variantId)
        .maybeSingle()

      if (existing) {
        await supabase
          .from('cart_items')
          .update({ quantity: (existing as CartItem).quantity + quantity })
          .eq('id', (existing as CartItem).id)
      } else {
        await supabase
          .from('cart_items')
          .insert({ user_id: session.user.id, variant_id: variantId, quantity })
      }
      await mergeLocalCartToServer()
    } else {
      const localItems = items as LocalCartItem[]
      const existing = localItems.find((i) => i.variant_id === variantId)
      if (existing) {
        existing.quantity += quantity
        const updated = [...localItems]
        setItems(updated)
        saveLocalCart(updated)
      } else {
        const variant = await fetchVariant(variantId)
        if (!variant) return
        const newItem: LocalCartItem = { variant_id: variantId, quantity, variant }
        const updated = [...localItems, newItem]
        setItems(updated)
        saveLocalCart(updated)
      }
    }
  }

  async function updateQuantity(variantId: string, quantity: number) {
    if (quantity <= 0) {
      await removeFromCart(variantId)
      return
    }

    if (session) {
      await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('user_id', session.user.id)
        .eq('variant_id', variantId)
      await mergeLocalCartToServer()
    } else {
      const localItems = items as LocalCartItem[]
      const item = localItems.find((i) => i.variant_id === variantId)
      if (item) {
        item.quantity = quantity
        const updated = [...localItems]
        setItems(updated)
        saveLocalCart(updated)
      }
    }
  }

  async function removeFromCart(variantId: string) {
    if (session) {
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', session.user.id)
        .eq('variant_id', variantId)
      await mergeLocalCartToServer()
    } else {
      const localItems = items as LocalCartItem[]
      const updated = localItems.filter((i) => i.variant_id !== variantId)
      setItems(updated)
      saveLocalCart(updated)
    }
  }

  async function clearCart() {
    if (session) {
      await supabase.from('cart_items').delete().eq('user_id', session.user.id)
      await mergeLocalCartToServer()
    } else {
      setItems([])
      localStorage.removeItem(LOCAL_STORAGE_KEY)
    }
  }

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => {
    const variant = 'variant' in item ? item.variant : undefined
    if (!variant) return sum
    return sum + variant.price * item.quantity
  }, 0)

  const value: CartContextType = {
    items,
    loading,
    itemCount,
    subtotal,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
