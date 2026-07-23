'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { StoreProduct } from '@/lib/types';

export interface CartItem {
  id: number;
  product_title: string;
  slug: string;
  price: string;
  price_cents: number;
  image: string;
  quantity: number;
  size: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: StoreProduct, size: string, quantity: number) => void;
  removeFromCart: (id: number, size: string) => void;
  updateQuantity: (id: number, size: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cart on client mount
  useEffect(() => {
    let restoredItems: CartItem[] = [];
    try {
      const stored = localStorage.getItem('sanga_cart');
      if (stored) {
        restoredItems = JSON.parse(stored) as CartItem[];
      }
    } catch (e) {
      console.error('Failed to load cart from localStorage', e);
    }
    queueMicrotask(() => {
      setCartItems(restoredItems);
      setIsInitialized(true);
    });
  }, []);

  // Save cart changes
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem('sanga_cart', JSON.stringify(cartItems));
      } catch (e) {
        console.error('Failed to save cart to localStorage', e);
      }
    }
  }, [cartItems, isInitialized]);

  const addToCart = useCallback((product: StoreProduct, size: string, quantity: number) => {
    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (item) => item.id === product.id && item.size === size
      );

      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex].quantity += quantity;
        return updated;
      }

      return [
        ...prevItems,
        {
          id: product.id,
          product_title: product.product_title,
          slug: product.slug,
          price: product.price,
          price_cents: product.price_cents,
          image: product.image,
          quantity: quantity,
          size: size,
        },
      ];
    });
  }, []);

  const removeFromCart = useCallback((id: number, size: string) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => !(item.id === id && item.size === size))
    );
  }, []);

  const updateQuantity = useCallback((id: number, size: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems((prevItems) =>
        prevItems.filter((item) => !(item.id === id && item.size === size))
      );
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id && item.size === size
          ? { ...item, quantity }
          : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const cartTotal = cartItems.reduce((sum, item) => {
    return sum + item.price_cents / 100 * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
