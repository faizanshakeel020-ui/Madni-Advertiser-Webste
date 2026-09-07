"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Filter, PackageSearch, Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ProductCard } from "@/components/site/product-card";
import { useRoute, withQuery } from "@/lib/router";
import { fetchCategories, fetchProducts } from "@/lib/api";
import type { Category, Product } from "@/lib/types";

const SORTS = [
  { value: "popular", label: "Most Popular" },
  { value: "featured", label: "Featured" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
];

const PRICE_BUCKETS = [
  { label: "Under Rs 2,000", min: 0, max: 2000 },
  { label: "Rs 2,000 – 5,000", min: 2000, max: 5000 },
  { label: "Rs 5,000 – 10,000", min: 5000, max: 10000 },
  { label: "Above Rs 10,000", min: 10000, max: undefined },
  { label: "Custom Pricing (Quote)", custom: true },
];

const PER_PAGE = 12;

export function ShopView() {
  const { route, navigate } = useRoute();
  const q = route.query;
  const [mobileFilters, setMobileFilters] = useState(false);
  const [searchText, setSearchText] = useState(q.q ?? "");

  const activeCat = q.cat ?? "";
  const activeType = q.type ?? "";
  const activeSort = q.sort ?? "popular";
  const activeMin = q.min ?? "";
  const activeMax = q.max ?? "";
  const activeQ = q.q ?? "";
  const page = Math.max(1, parseInt(q.page ?? "1", 10) || 1);

  const { data: cats } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });

  const queryParams = {
    cat: activeCat || undefined,
    q: activeQ || undefined,
    type: activeType || undefined,
    min: activeMin ? Number(activeMin) : undefined,
    max: activeMax ? Number(activeMax) : undefined,
    sort: activeSort,
    page,
    per: PER_PAGE,
  };
  const { data, isPending, isError } = useQuery({
    queryKey: ["products", JSON.stringify(queryParams)],
    queryFn: () => fetchProducts(queryParams),
  });

  const setParam = (key: string, value?: string) => {
    const next: Record<string, string | undefined> = { ...q };
    if (value === undefined || value === "") delete next[key];
    else next[key] = value;
    if (key !== "page" && key !== "sort") delete next.page; // reset pagination on filter change
    navigate(withQuery("/shop", next), { replace: true });
  };

  const setPriceBucket = (bucket: (typeof PRICE_BUCKETS)[number]) => {
    const next: Record<string, string | undefined> = { ...q };
    if (bucket.custom) {
      if (next.type === "CUSTOM_ORDER") {
        delete next.min;
        delete next.max;
        navigate(withQuery("/shop", next), { replace: true });
        return;
      }
      next.type = "CUSTOM_ORDER";
      delete next.min;
      delete next.max;
    } else {
      if (next.min === String(bucket.min) && next.max === String(bucket.max ?? "")) {
        delete next.min;
        delete next.max;
        navigate(withQuery("/shop", next), { replace: true });
        return;
      }
      next.min = String(bucket.min);
      next.max = bucket.max === undefined ? undefined : String(bucket.max);
      delete next.type;
    }
    delete next.page;
    navigate(withQuery("/shop", next), { replace: true });
  };

  const activeBucketIdx = PRICE_BUCKETS.findIndex((b) =>
    b.custom
      ? activeType === "CUSTOM_ORDER"
      : activeMin === String(b.min) && (b.max === undefined ? !activeMax : activeMax === String(b.max))
  );

  const hasFilters = Boolean(activeCat || activeType || activeMin || activeMax || activeQ || activeSort !== "popular");
  const loading = isPending;
  const items: Product[] = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 0;

  const filterProps = {
    cats: cats ?? [],
    activeCat,
    activeType,
    activeMin,
    activeMax,
    activeBucketIdx,
    hasFilters,
    setParam,
    setPriceBucket,
    navigate,
  };

  return (
    <div>
      {/* Page header */}
      <div className="border-b bg-zinc-950 py-10 lg:py-12">
        <div className="container-site">
          <p className="mb-2 font-display text-xs font-bold uppercase tracking-[0.2em] text-primary">The Shop</p>
          <h1 className="font-display text-3xl font-bold text-white lg:text-4xl">Signage Shop</h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-400">
            Ready-made signs with instant checkout, plus custom-order items quoted to your exact size and specs.
          </p>
          <form
            className="relative mt-6 max-w-md"
            onSubmit={(e) => {
              e.preventDefault();
              setParam("q", searchText.trim());
            }}
            role="search"
          >
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search within shop…"
              className="h-11 rounded-full border-white/15 bg-white/10 pl-10 text-white placeholder:text-zinc-500"
              aria-label="Search products"
            />
          </form>
        </div>
      </div>

      <div className="container-site py-8 lg:py-10">
        <div className="flex gap-8">
          {/* Sidebar (desktop) */}
          <aside className="hidden w-64 shrink-0 lg:block" aria-label="Product filters">
            <div className="sticky top-32 max-h-[calc(100vh-9rem)] overflow-y-auto pr-2 scrollbar-thin">
              <ShopFilters {...filterProps} />
            </div>
          </aside>

          {/* Main grid */}
          <div className="min-w-0 flex-1">
            {/* Toolbar */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Sheet open={mobileFilters} onOpenChange={setMobileFilters}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="font-bold lg:hidden">
                      <SlidersHorizontal className="mr-1.5 h-4 w-4" aria-hidden="true" /> Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px] overflow-y-auto p-0">
                    <SheetHeader className="border-b p-4">
                      <SheetTitle className="flex items-center gap-2 text-left">
                        <Filter className="h-4 w-4 text-primary" aria-hidden="true" /> Filters
                      </SheetTitle>
                    </SheetHeader>
                    <div className="p-4">
                      <ShopFilters {...filterProps} />
                    </div>
                  </SheetContent>
                </Sheet>
                <p className="text-sm text-zinc-500">
                  {loading ? (
                    "Loading…"
                  ) : (
                    <>
                      <span className="font-bold text-zinc-900">{total}</span> product
                      {total === 1 ? "" : "s"}
                      {activeQ && (
                        <>
                          {" "}for <span className="font-bold text-zinc-900">“{activeQ}”</span>
                        </>
                      )}
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden text-xs font-medium text-zinc-500 sm:inline">Sort by</span>
                <Select value={activeSort} onValueChange={(v) => setParam("sort", v)}>
                  <SelectTrigger className="h-9 w-[170px] text-sm" aria-label="Sort products">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORTS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active filter chips */}
            {(activeCat || activeQ || activeType || activeBucketIdx >= 0) && (
              <div className="mb-5 flex flex-wrap gap-2">
                {activeCat && (
                  <button onClick={() => setParam("cat", "")}>
                    <Badge variant="secondary" className="gap-1.5 bg-zinc-100 py-1.5 pl-3 pr-2 text-zinc-700 hover:bg-zinc-200">
                      {(cats ?? []).find((c) => c.slug === activeCat)?.name ?? activeCat} <X className="h-3 w-3" aria-hidden="true" />
                    </Badge>
                  </button>
                )}
                {activeQ && (
                  <button onClick={() => setParam("q", "")}>
                    <Badge variant="secondary" className="gap-1.5 bg-zinc-100 py-1.5 pl-3 pr-2 text-zinc-700 hover:bg-zinc-200">
                      “{activeQ}” <X className="h-3 w-3" aria-hidden="true" />
                    </Badge>
                  </button>
                )}
                {activeType && (
                  <button onClick={() => setParam("type", "")}>
                    <Badge variant="secondary" className="gap-1.5 bg-zinc-100 py-1.5 pl-3 pr-2 text-zinc-700 hover:bg-zinc-200">
                      {activeType === "BUY_NOW" ? "Buy Now items" : "Custom Order items"} <X className="h-3 w-3" aria-hidden="true" />
                    </Badge>
                  </button>
                )}
                {activeBucketIdx >= 0 && (
                  <button onClick={() => setPriceBucket(PRICE_BUCKETS[activeBucketIdx])}>
                    <Badge variant="secondary" className="gap-1.5 bg-zinc-100 py-1.5 pl-3 pr-2 text-zinc-700 hover:bg-zinc-200">
                      {PRICE_BUCKETS[activeBucketIdx].label} <X className="h-3 w-3" aria-hidden="true" />
                    </Badge>
                  </button>
                )}
              </div>
            )}

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-zinc-100" aria-hidden="true" />
                ))}
              </div>
            ) : isError || (items.length === 0) ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
                <PackageSearch className="h-12 w-12 text-zinc-300" aria-hidden="true" />
                <h3 className="mt-4 font-display text-lg font-bold text-zinc-900">No products found</h3>
                <p className="mt-1.5 max-w-sm text-sm text-zinc-500">
                  Try changing your filters or search, or request a custom quote — we fabricate almost anything.
                </p>
                <div className="mt-5 flex gap-3">
                  <Button variant="outline" className="font-bold" onClick={() => navigate("/shop")}>
                    Clear Filters
                  </Button>
                  <Button className="font-bold" onClick={() => navigate("/quote")}>
                    Request Custom Sign
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {items.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {pages > 1 && (
              <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Pagination">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  disabled={page <= 1}
                  onClick={() => setParam("page", String(page - 1))}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </Button>
                {Array.from({ length: pages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 1)
                  .map((p, i, arr) => (
                    <span key={p} className="flex items-center gap-1.5">
                      {i > 0 && p - arr[i - 1] > 1 && <span className="px-1 text-zinc-400">…</span>}
                      <button
                        onClick={() => setParam("page", String(p))}
                        className={`h-9 w-9 rounded-md text-sm font-bold ${
                          p === page ? "bg-primary text-primary-foreground" : "border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                        }`}
                        aria-current={p === page ? "page" : undefined}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  disabled={page >= pages}
                  onClick={() => setParam("page", String(page + 1))}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </nav>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Filters (standalone component) ---------- */
function ShopFilters({
  cats,
  activeCat,
  activeType,
  activeBucketIdx,
  hasFilters,
  setParam,
  setPriceBucket,
  navigate,
}: {
  cats: Category[];
  activeCat: string;
  activeType: string;
  activeMin: string;
  activeMax: string;
  activeBucketIdx: number;
  hasFilters: boolean;
  setParam: (key: string, value?: string) => void;
  setPriceBucket: (bucket: (typeof PRICE_BUCKETS)[number]) => void;
  navigate: (to: string, opts?: { replace?: boolean }) => void;
}) {
  const activeCatObj = cats.find((c) => c.slug === activeCat);

  return (
    <div className="space-y-6">
      {/* Category */}
      <div>
        <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-zinc-900">Category</h3>
        <div className="space-y-1">
          <button
            onClick={() => setParam("cat", "")}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
              !activeCat ? "bg-accent font-bold text-accent-foreground" : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            All Categories
          </button>
          {cats.map((c) => (
            <button
              key={c.id}
              onClick={() => setParam("cat", c.slug)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                activeCat === c.slug ? "bg-accent font-bold text-accent-foreground" : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {c.name}
              <span className="text-xs text-zinc-400">{c.productCount ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Product type */}
      <div>
        <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-zinc-900">Product Type</h3>
        <RadioGroup value={activeType} onValueChange={(v) => setParam("type", v === "all" ? "" : v)}>
          <div className="flex items-center gap-2 rounded-lg px-3 py-2">
            <RadioGroupItem value="all" id="ft-all" />
            <Label htmlFor="ft-all" className="cursor-pointer text-sm font-normal text-zinc-600">All items</Label>
          </div>
          <div className="flex items-center gap-2 rounded-lg px-3 py-2">
            <RadioGroupItem value="BUY_NOW" id="ft-buy" />
            <Label htmlFor="ft-buy" className="cursor-pointer text-sm font-normal text-zinc-600">
              Buy Now <Badge className="ml-1 bg-emerald-600 text-white hover:bg-emerald-600">Cart</Badge>
            </Label>
          </div>
          <div className="flex items-center gap-2 rounded-lg px-3 py-2">
            <RadioGroupItem value="CUSTOM_ORDER" id="ft-custom" />
            <Label htmlFor="ft-custom" className="cursor-pointer text-sm font-normal text-zinc-600">
              Custom Order <Badge variant="secondary" className="ml-1 bg-amber-100 text-amber-800 hover:bg-amber-100">Quote</Badge>
            </Label>
          </div>
        </RadioGroup>
      </div>

      <Separator />

      {/* Price */}
      <div>
        <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-zinc-900">Price</h3>
        <div className="space-y-1">
          {PRICE_BUCKETS.map((b, i) => (
            <button
              key={b.label}
              onClick={() => setPriceBucket(b)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm ${
                activeBucketIdx === i ? "bg-accent font-bold text-accent-foreground" : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                  activeBucketIdx === i ? "border-primary bg-primary text-primary-foreground" : "border-zinc-300"
                }`}
                aria-hidden="true"
              >
                {activeBucketIdx === i && (
                  <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M2.5 6.5 5 9l4.5-5.5" />
                  </svg>
                )}
              </span>
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {activeCatObj && (
        <>
          <Separator />
          <div className="rounded-lg bg-zinc-50 p-4">
            <p className="text-sm font-bold text-zinc-900">{activeCatObj.name}</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">{activeCatObj.description}</p>
          </div>
        </>
      )}

      {hasFilters && (
        <Button
          variant="outline"
          className="w-full font-bold"
          onClick={() => navigate("/shop", { replace: true })}
        >
          <X className="mr-1.5 h-4 w-4" aria-hidden="true" /> Clear All Filters
        </Button>
      )}
    </div>
  );
}
