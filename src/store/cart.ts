"use client";

/**
 * Cart store — Zustand with localStorage persistence.
 * Only BUY_NOW products are added to the cart.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/lib/types";

type CartState = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string, key: string) => void;
  setQty: (id: string, key: string, qty: number) => void;
  clear: () => void;
};

/** unique key per item+selection combo */
export function itemKey(item: Pick<CartItem, "id" | "selections">) {
  const sel = item.selections
    ?.map((s) => `${s.label}:${s.value}`)
    .sort()
    .join("|");
  return sel ? `${item.id}#${sel}` : item.id;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const key = itemKey(item);
          const existing = state.items.find((i) => itemKey(i) === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                itemKey(i) === key
                  ? { ...i, qty: Math.min(99, i.qty + item.qty) }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),
      removeItem: (id, key) =>
        set((state) => ({
          items: state.items.filter((i) => itemKey(i) !== key),
        })),
      setQty: (id, key, qty) =>
        set((state) => ({
          items: state.items
            .map((i) => (itemKey(i) === key ? { ...i, qty: Math.max(1, Math.min(99, qty)) } : i))
            .filter((i) => i.qty > 0),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: "madni-cart" }
  )
);

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.price * i.qty, 0);
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.qty, 0);
}
