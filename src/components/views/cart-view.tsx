"use client";

import { ArrowRight, Minus, PackageOpen, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart, cartSubtotal, itemKey } from "@/store/cart";
import { useRoute } from "@/lib/router";
import { formatPKR } from "@/lib/format";

export function CartView() {
  const { navigate } = useRoute();
  const { items, setQty, removeItem, clear } = useCart();
  const subtotal = cartSubtotal(items);

  if (items.length === 0) {
    return (
      <div className="container-site flex flex-col items-center py-20 text-center lg:py-28">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100">
          <PackageOpen className="h-10 w-10 text-zinc-400" aria-hidden="true" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold text-zinc-900">Your cart is empty</h1>
        <p className="mt-2 max-w-sm text-sm text-zinc-500">
          Browse our ready-made signs and add something that makes your space shine.
        </p>
        <Button size="lg" className="mt-6 rounded-full px-7 font-bold" onClick={() => navigate("/shop")}>
          <ShoppingBag className="mr-2 h-4 w-4" aria-hidden="true" /> Start Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="container-site py-8 lg:py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-zinc-900 sm:text-3xl">
          Shopping Cart <span className="text-base font-medium text-zinc-400">({items.length} {items.length === 1 ? "item" : "items"})</span>
        </h1>
        <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => { clear(); toast.success("Cart cleared"); }}>
          Clear Cart
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Items */}
        <div className="lg:col-span-2">
          <ul className="divide-y rounded-2xl border bg-white">
            {items.map((item) => {
              const key = itemKey(item);
              return (
                <li key={key} className="flex gap-4 p-4 sm:p-5">
                  <button
                    onClick={() => navigate(`/product/${item.slug}`)}
                    className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border bg-zinc-50 sm:h-28 sm:w-28"
                    aria-label={`View ${item.name}`}
                  >
                    { }
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  </button>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <button
                          onClick={() => navigate(`/product/${item.slug}`)}
                          className="line-clamp-2 text-left font-display text-sm font-bold text-zinc-900 hover:text-primary sm:text-base"
                        >
                          {item.name}
                        </button>
                        {item.selections && item.selections.length > 0 && (
                          <p className="mt-1 text-xs text-zinc-500">
                            {item.selections.map((s) => `${s.label}: ${s.value}`).join(" · ")}
                          </p>
                        )}
                        <p className="mt-1 text-sm font-bold text-primary">{formatPKR(item.price)}</p>
                      </div>
                      <button
                        onClick={() => {
                          removeItem(item.id, key);
                          toast.success("Removed from cart");
                        }}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex h-9 items-center rounded-lg border">
                        <button
                          onClick={() => setQty(item.id, key, item.qty - 1)}
                          className="flex h-full w-9 items-center justify-center text-zinc-600 hover:text-primary disabled:opacity-30"
                          disabled={item.qty <= 1}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <span className="w-9 text-center text-sm font-bold">{item.qty}</span>
                        <button
                          onClick={() => setQty(item.id, key, item.qty + 1)}
                          className="flex h-full w-9 items-center justify-center text-zinc-600 hover:text-primary"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                      <p className="font-display text-base font-bold text-zinc-900">
                        {formatPKR(item.price * item.qty)}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <Button variant="outline" className="mt-5 font-bold" onClick={() => navigate("/shop")}>
            Continue Shopping
          </Button>
        </div>

        {/* Summary */}
        <aside className="lg:col-span-1">
          <div className="sticky top-32 rounded-2xl border bg-zinc-50 p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold text-zinc-900">Order Summary</h2>
            <div className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal</span>
                <span className="font-bold text-zinc-900">{formatPKR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Delivery</span>
                <span className="text-emerald-700 font-semibold">Calculated on confirmation</span>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="flex items-baseline justify-between">
              <span className="font-display text-base font-bold text-zinc-900">Total</span>
              <span className="font-display text-2xl font-bold text-zinc-900">{formatPKR(subtotal)}</span>
            </div>
            <Button size="lg" className="mt-5 w-full rounded-xl font-bold" onClick={() => navigate("/checkout")}>
              Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
            <p className="mt-3 text-center text-xs leading-relaxed text-zinc-500">
              Cash on Delivery & Bank Transfer available.
              Custom-order items are quoted separately — not added to this cart.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
