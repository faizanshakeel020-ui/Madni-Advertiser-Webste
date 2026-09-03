"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  ChevronRight,
  Loader2,
  Minus,
  Package,
  PencilRuler,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductCard, TypeBadge } from "@/components/site/product-card";
import { QuoteForm } from "@/components/site/quote-form";
import { WhatsAppIcon } from "@/components/site/icons";
import { useRoute } from "@/lib/router";
import { fetchProduct } from "@/lib/api";
import { formatPKR } from "@/lib/format";
import { whatsappUrl } from "@/lib/constants";
import { useCart } from "@/store/cart";
import type { Product } from "@/lib/types";

export function ProductDetailView({ slug }: { slug: string }) {
  const { navigate } = useRoute();
  const [data, setData] = useState<{ product: Product; related: Product[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [qty, setQty] = useState(1);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const [customNotes, setCustomNotes] = useState("");
  const addItem = useCart((s) => s.addItem);

  useEffect(() => {
    let alive = true;
    fetchProduct(slug)
      .then((d) => alive && setData(d))
      .catch(() => alive && setNotFound(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="container-site py-10">
        <div className="grid gap-10 lg:grid-cols-2">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-48" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="container-site flex flex-col items-center py-24 text-center">
        <Package className="h-14 w-14 text-zinc-300" aria-hidden="true" />
        <h1 className="mt-4 font-display text-2xl font-bold text-zinc-900">Product not found</h1>
        <p className="mt-2 text-sm text-zinc-500">This product may have been removed or renamed.</p>
        <Button className="mt-6 font-bold" onClick={() => navigate("/shop")}>
          Back to Shop <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    );
  }

  const { product, related } = data;
  const isBuyNow = product.type === "BUY_NOW";
  const images = product.images.length ? product.images : ["/images/p-acrylic-led-nameplate.png"];

  const handleAddToCart = () => {
    // validate options selected
    for (const opt of product.options) {
      if (!selections[opt.label]) {
        toast.error("Please select an option", { description: `Choose a ${opt.label.toLowerCase()} first.` });
        return;
      }
    }
    setAdding(true);
    setTimeout(() => {
      addItem({
        id: product.id,
        slug: product.slug,
        name: product.name,
        image: images[0],
        price: product.price ?? 0,
        qty,
        selections: product.options.map((o) => ({ label: o.label, value: selections[o.label] })).filter((s) => s.value),
      });
      toast.success("Added to cart", {
        description: `${qty} × ${product.name}`,
        action: { label: "View Cart", onClick: () => navigate("/cart") },
      });
      setAdding(false);
    }, 250);
  };

  const buildQuoteDetails = () => {
    const opts = product.options
      .map((o) => `${o.label}: ${selections[o.label] ?? "—"}`)
      .join("\n");
    return [
      `Product: ${product.name}`,
      opts,
      `Quantity: ${qty}`,
      customNotes ? `Notes: ${customNotes}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  };

  return (
    <div className="bg-white">
      <div className="container-site py-6 lg:py-10">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-zinc-500">
          <button onClick={() => navigate("/")} className="hover:text-primary">Home</button>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <button onClick={() => navigate("/shop")} className="hover:text-primary">Shop</button>
          {product.category && (
            <>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              <button onClick={() => navigate(`/shop?cat=${product.category!.slug}`)} className="hover:text-primary">
                {product.category.name}
              </button>
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="font-medium text-zinc-800 line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          {/* ============ Gallery ============ */}
          <div>
            <div
              className="relative aspect-square overflow-hidden rounded-2xl border bg-zinc-50"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setZoom({
                  x: ((e.clientX - rect.left) / rect.width) * 100,
                  y: ((e.clientY - rect.top) / rect.height) * 100,
                });
              }}
              onMouseLeave={() => setZoom(null)}
            >
              { }
              <img
                src={images[imgIdx]}
                alt={product.name}
                className="gallery-zoom h-full w-full cursor-zoom-in object-cover"
                style={zoom ? { transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
              />
              <div className="absolute left-3 top-3 flex flex-col gap-1.5">
                <TypeBadge type={product.type} />
                {product.badge && (
                  <Badge className="bg-primary text-primary-foreground hover:bg-primary">{product.badge}</Badge>
                )}
              </div>
              <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-white backdrop-blur">
                Hover to zoom
              </span>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="mt-4 grid grid-cols-5 gap-3">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    className={`aspect-square overflow-hidden rounded-lg border-2 bg-zinc-50 ${
                      imgIdx === i ? "border-primary" : "border-transparent hover:border-zinc-300"
                    }`}
                    aria-label={`View image ${i + 1}`}
                  >
                    { }
                    <img src={img} alt={`${product.name} — view ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}

            {/* Trust bullets */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { icon: PencilRuler, text: "Free design mockup" },
                { icon: Truck, text: "Delivery across Pakistan" },
                { icon: ShieldCheck, text: "Quality warranty" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex flex-col items-center gap-1.5 rounded-xl border bg-zinc-50/60 p-3 text-center">
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <span className="text-[11px] font-semibold text-zinc-600">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ============ Info ============ */}
          <div>
            <h1 className="font-display text-2xl font-bold leading-tight text-zinc-900 sm:text-3xl">
              {product.name}
            </h1>

            <div className="mt-4 flex items-end gap-3">
              {product.price ? (
                <>
                  <p className="font-display text-3xl font-bold text-zinc-900">{formatPKR(product.price)}</p>
                  {product.oldPrice && (
                    <p className="pb-1 text-base text-zinc-400 line-through">{formatPKR(product.oldPrice)}</p>
                  )}
                </>
              ) : (
                <div>
                  <p className="font-display text-2xl font-bold text-primary">Custom Pricing</p>
                  <p className="mt-0.5 text-sm text-zinc-500">
                    This item is made to order — request a free quote with your exact specs.
                  </p>
                </div>
              )}
            </div>

            <p className="mt-5 leading-relaxed text-zinc-600">{product.description}</p>

            <Separator className="my-6" />

            {/* Options */}
            {product.options.length > 0 && (
              <div className="space-y-4">
                {product.options.map((opt) => (
                  <div key={opt.label}>
                    <Label className="mb-2 block text-sm font-bold text-zinc-800">
                      {opt.label} <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {opt.values.map((v) => (
                        <button
                          key={v}
                          onClick={() => setSelections((s) => ({ ...s, [opt.label]: v }))}
                          className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                            selections[opt.label] === v
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-zinc-300 bg-white text-zinc-700 hover:border-primary/50 hover:text-primary"
                          }`}
                          aria-pressed={selections[opt.label] === v}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Buy vs Custom flows */}
            {isBuyNow ? (
              <div className="mt-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 items-center rounded-lg border">
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="flex h-full w-11 items-center justify-center text-zinc-600 hover:text-primary disabled:opacity-30"
                      disabled={qty <= 1}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <span className="w-10 text-center font-display text-lg font-bold" aria-live="polite">{qty}</span>
                    <button
                      onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                      className="flex h-full w-11 items-center justify-center text-zinc-600 hover:text-primary disabled:opacity-30"
                      disabled={qty >= product.stock}
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                  <span className="text-sm text-zinc-500">
                    {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                  </span>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Button
                    size="lg"
                    className="h-13 flex-1 rounded-xl py-3.5 text-base font-bold"
                    disabled={adding || product.stock <= 0}
                    onClick={handleAddToCart}
                  >
                    {adding ? (
                      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                    ) : (
                      <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                    )}
                    Add to Cart
                  </Button>
                  <a
                    href={whatsappUrl(
                      `Hello! I want to order this product:\n${product.name}\nPrice: ${product.price ? formatPKR(product.price) : "custom"}\n(Link: ${typeof window !== "undefined" ? window.location.href : ""})`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-13 w-full rounded-xl border-emerald-500 py-3.5 text-base font-bold text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      <WhatsAppIcon className="h-5 w-5" aria-hidden="true" /> Order on WhatsApp
                    </Button>
                  </a>
                </div>
                <p className="mt-3 text-xs text-zinc-400">
                  Cash on Delivery & Bank Transfer available at checkout.
                </p>
              </div>
            ) : (
              <div className="mt-7">
                {!showQuote ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
                    <div className="flex items-start gap-3">
                      <PencilRuler className="mt-0.5 h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
                      <div className="flex-1">
                        <h3 className="font-display text-base font-bold text-zinc-900">Custom-made to your specs</h3>
                        <p className="mt-1 text-sm text-zinc-600">
                          Select your options above and send us a quote request — we&apos;ll reply with pricing,
                          timeline and a free design mockup.
                        </p>
                        <div className="mt-4">
                          <Label htmlFor="pd-notes" className="text-sm font-bold text-zinc-800">
                            Notes (size, text, deadline…)
                          </Label>
                          <Textarea
                            id="pd-notes"
                            rows={3}
                            value={customNotes}
                            onChange={(e) => setCustomNotes(e.target.value)}
                            placeholder="e.g. Need it 8ft wide for my shop in Lahore by next week…"
                            className="mt-2 bg-white"
                          />
                        </div>
                        <Button size="lg" className="mt-4 w-full rounded-xl font-bold" onClick={() => setShowQuote(true)}>
                          Request Quote for This Item <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border p-5">
                    <QuoteForm
                      defaultService={product.category?.name ? `${product.category.name} (Custom)` : "Custom / Other Project"}
                      productName={product.name}
                      compact
                      title={`Request Quote — ${product.name}`}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Specs table */}
            {product.specs.length > 0 && (
              <div className="mt-8">
                <h3 className="mb-3 font-display text-base font-bold text-zinc-900">Specifications</h3>
                <div className="overflow-hidden rounded-xl border">
                  <table className="w-full text-sm">
                    <tbody>
                      {product.specs.map((spec, i) => (
                        <tr key={spec.label} className={i % 2 === 0 ? "bg-zinc-50/70" : "bg-white"}>
                          <th scope="row" className="w-2/5 px-4 py-3 text-left font-bold text-zinc-700">
                            {spec.label}
                          </th>
                          <td className="px-4 py-3 text-zinc-600">{spec.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ============ Related products ============ */}
        {related.length > 0 && (
          <section className="mt-16" aria-label="Related products">
            <div className="mb-6 flex items-end justify-between">
              <h2 className="font-display text-xl font-bold text-zinc-900 sm:text-2xl">You May Also Like</h2>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full font-bold"
                onClick={() => navigate(`/shop?cat=${product.category?.slug ?? ""}`)}
              >
                More in {product.category?.name ?? "Shop"} <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {related.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* Service CTA strip */}
        <section className="mt-16 overflow-hidden rounded-2xl bg-zinc-950 px-6 py-10 text-center sm:px-12">
          <Wrench className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
          <h2 className="mt-3 font-display text-xl font-bold text-white sm:text-2xl">
            Need a different size or fully custom sign?
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-zinc-400">
            We fabricate almost anything — from single name plates to complete building signage.
          </p>
          <Button size="lg" className="mt-5 rounded-full px-7 font-bold" onClick={() => navigate("/quote")}>
            Get a Free Quote <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Button>
        </section>
      </div>
    </div>
  );
}
