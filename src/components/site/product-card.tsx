"use client";

import { useState } from "react";
import { ShoppingCart, ArrowRight, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/store/cart";
import { useRoute } from "@/lib/router";
import { formatPKR } from "@/lib/format";
import type { Product } from "@/lib/types";

export function TypeBadge({ type }: { type: Product["type"] }) {
  return type === "BUY_NOW" ? (
    <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 gap-1">
      <Zap className="h-3 w-3" aria-hidden="true" /> Buy Now
    </Badge>
  ) : (
    <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 border border-amber-300">
      Custom Order
    </Badge>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const { navigate } = useRoute();
  const addItem = useCart((s) => s.addItem);
  const [adding, setAdding] = useState(false);
  const isBuyNow = product.type === "BUY_NOW";

  const handleAdd = () => {
    if (!isBuyNow) {
      navigate(`/product/${product.slug}`);
      return;
    }
    setAdding(true);
    // slight delay to show loading feedback
    setTimeout(() => {
      addItem({
        id: product.id,
        slug: product.slug,
        name: product.name,
        image: product.images[0] ?? "",
        price: product.price ?? 0,
        qty: 1,
      });
      toast.success("Added to cart", {
        description: product.name,
        action: {
          label: "View Cart",
          onClick: () => navigate("/cart"),
        },
      });
      setAdding(false);
    }, 250);
  };

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition-all hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-950/5">
      <button
        onClick={() => navigate(`/product/${product.slug}`)}
        className="relative aspect-square overflow-hidden bg-zinc-50 text-left"
        aria-label={`View ${product.name}`}
      >
        { }
        <img
          src={product.images[0] ?? "/images/p-acrylic-led-nameplate.png"}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover img-zoom"
        />
        <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
          <TypeBadge type={product.type} />
          {product.badge && (
            <Badge className="bg-primary text-primary-foreground hover:bg-primary">{product.badge}</Badge>
          )}
        </div>
        {product.oldPrice && product.price && (
          <span className="absolute right-2.5 top-2.5 rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">
            {Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}% OFF
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col p-4">
        <button
          onClick={() => navigate(`/product/${product.slug}`)}
          className="text-left font-display text-[15px] font-bold leading-snug text-zinc-900 transition-colors hover:text-primary line-clamp-2"
        >
          {product.name}
        </button>
        <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{product.description}</p>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className={`font-display text-lg font-bold ${product.price ? "text-zinc-900" : "text-primary"}`}>
              {product.price ? formatPKR(product.price) : "Custom Pricing"}
            </p>
            {product.oldPrice && (
              <p className="text-xs text-zinc-400 line-through">{formatPKR(product.oldPrice)}</p>
            )}
          </div>
          {isBuyNow && product.stock > 0 && (
            <span className="text-[11px] font-medium text-emerald-700">In stock</span>
          )}
        </div>

        <div className="mt-3.5 pt-0.5">
          {isBuyNow ? (
            <Button
              size="sm"
              className="w-full font-bold"
              disabled={adding || product.stock <= 0}
              onClick={handleAdd}
            >
              {adding ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <ShoppingCart className="h-4 w-4" aria-hidden="true" />
              )}
              {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="w-full border-primary/40 font-bold text-primary hover:bg-primary hover:text-primary-foreground"
              onClick={() => navigate(`/product/${product.slug}`)}
            >
              Request Quote <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
