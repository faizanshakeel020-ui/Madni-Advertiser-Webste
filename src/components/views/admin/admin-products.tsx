"use client";

/**
 * Admin — Products management (add/edit/delete, images, categories, type, stock).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Star,
  Tags,
  Trash2,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  adminDeleteCategory,
  adminCategorizeProduct,
  adminDeleteProduct,
  adminDeleteProducts,
  adminFetchProducts,
  adminGenerateDescription,
  adminSaveCategory,
  adminSaveProduct,
  fetchCategories,
  uploadImages,
  type GenerateDescriptionResponse,
} from "@/lib/api";
import { formatPKR, slugify } from "@/lib/format";
import { useRoute } from "@/lib/router";
import type { Category, Product, ProductOption, ProductSpec } from "@/lib/types";

type EditState = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  oldPrice: string;
  type: "BUY_NOW" | "CUSTOM_ORDER" | "BOTH";
  categoryId: string;
  subcategoryId: string;
  images: string[];
  specs: ProductSpec[];
  options: ProductOption[];
  badge: string;
  stock: string;
  featured: boolean;
};

const emptyProduct: EditState = {
  name: "",
  slug: "",
  description: "",
  price: "",
  oldPrice: "",
  type: "BOTH",
  categoryId: "",
  subcategoryId: "",
  images: [],
  specs: [],
  options: [],
  badge: "",
  stock: "10",
  featured: false,
};

export function AdminProducts() {
  const queryClient = useQueryClient();
  const { navigate } = useRoute();
  const [products, setProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [section, setSection] = useState<"products" | "categories">("products");
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [imgUrlInput, setImgUrlInput] = useState("");
  // AI auto-categorization state
  const [detecting, setDetecting] = useState(false);
  const [detectedLabel, setDetectedLabel] = useState<string | null>(null);
  const catTouched = useRef(false); // set when the admin manually picks a category
  const lastDetectKey = useRef(""); // "name|desc" of the last auto-detect run
  // AI description generation state
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [seoInfo, setSeoInfo] = useState<GenerateDescriptionResponse | null>(null);
  const descTouched = useRef(false); // set when the admin types their own description
  const lastGenKey = useRef(""); // product name of the last auto-generation attempt
  const variationRef = useRef(1); // regenerate → different angle each click

  const load = async () => {
    setLoading(true);
    const productsRequest = adminFetchProducts()
      .then((ps) => setProducts(ps))
      .catch(() => {
        toast.error("Failed to load products");
      });
    fetchCategories()
      .then((cs) => setCats(cs))
      .catch(() => {});
    try {
      await productsRequest;
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          !search ||
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.slug.toLowerCase().includes(search.toLowerCase())
      ),
    [products, search]
  );

  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selectedProductIds.has(p.id));
  const toggleProduct = (id: string, checked: boolean) => {
    setSelectedProductIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const deleteSelected = async () => {
    const ids = [...selectedProductIds];
    if (ids.length === 0) return;
    setBulkDeleting(true);
    try {
      const result = await adminDeleteProducts(ids);
      setProducts((current) => current.filter((p) => !selectedProductIds.has(p.id)));
      setSelectedProductIds(new Set());
      const refreshedCategories = await fetchCategories();
      setCats(refreshedCategories);
      queryClient.setQueryData(["categories"], refreshedCategories);
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(`${result.deleted} product${result.deleted === 1 ? "" : "s"} deleted`);
      setBulkDeleteOpen(false);
    } catch (e) {
      toast.error("Bulk delete failed", { description: e instanceof Error ? e.message : "" });
    } finally {
      setBulkDeleting(false);
    }
  };

  /** Ask the backend to auto-assign category + subcategory from the product name/description. */
  const runDetect = useCallback(
    async (name: string, description: string) => {
      if (!name.trim()) return;
      setDetecting(true);
      try {
        const res = await adminCategorizeProduct(name.trim(), description.trim() || undefined);
        if (res?.categoryId) {
          setEditing((s) =>
            s && !catTouched.current
              ? { ...s, categoryId: res.categoryId, subcategoryId: res.subcategoryId ?? "" }
              : s
          );
          const label = `${res.categoryName}${res.subcategoryName ? ` › ${res.subcategoryName}` : ""}`;
          setDetectedLabel(label);
          toast.success(`Category auto-assigned: ${label}`, {
            description: "You can still change it manually.",
          });
        }
      } catch {
        // silent — admin can still pick manually; server retries on save
      } finally {
        setDetecting(false);
      }
    },
    []
  );

  // Auto-detect while typing a NEW product's name (debounced, never overrides a manual pick,
  // and stops once a category has been assigned)
  useEffect(() => {
    if (!editing || editing.id || catTouched.current || editing.categoryId) return;
    const name = editing.name.trim();
    const desc = editing.description.trim();
    if (name.length < 4) return;
    const key = `${name}|${desc}`;
    if (key === lastDetectKey.current) return;
    const t = setTimeout(() => {
      lastDetectKey.current = key;
      void runDetect(name, desc);
    }, 1200);
    return () => clearTimeout(t);
  }, [editing, runDetect]);

  const detectNow = () => {
    if (!editing || !editing.name.trim()) {
      toast.error("Type a product name first");
      return;
    }
    catTouched.current = false; // allow auto-fill again
    lastDetectKey.current = `${editing.name.trim()}|${editing.description.trim()}`;
    setDetectedLabel(null);
    void runDetect(editing.name, editing.description);
  };

  /** AI-write an SEO-optimized description and fill the textarea. */
  const runGenerateDesc = useCallback(
    async (
      src: {
        name: string;
        categoryId: string;
        subcategoryId: string;
        type: "BUY_NOW" | "CUSTOM_ORDER" | "BOTH";
        price: string;
        description: string;
      },
      variation: number
    ) => {
      setGeneratingDesc(true);
      try {
        // short existing text = the admin's notes → use as hints for the writer
        const notes = src.description.trim();
        const hints = notes.length > 0 && notes.length < 120 ? notes : undefined;
        const res = await adminGenerateDescription({
          name: src.name.trim(),
          categoryId: src.categoryId || null,
          subcategoryId: src.subcategoryId || null,
          type: src.type,
          price: src.price ? Number(src.price) : null,
          hints,
          variation,
        });
        setEditing((s) => (s ? { ...s, description: res.description } : s));
        setSeoInfo(res);
        if (res.method === "ai") {
          toast.success("AI wrote an SEO-optimized description", {
            description: `${res.wordCount} words · ${res.keywords.length} ranking keywords built in. Edit freely.`,
          });
        } else {
          toast.info("Description generated", {
            description: "AI was busy — an SEO template was used. Try Regenerate for a fresh AI draft.",
          });
        }
      } catch {
        toast.error("AI description failed", { description: "Write it manually or try again." });
      } finally {
        setGeneratingDesc(false);
      }
    },
    []
  );

  // Auto-write the description for a NEW product once the name settles
  // (debounced 2.5s, only while empty, never after manual typing or a failed attempt)
  useEffect(() => {
    if (!editing || editing.id || descTouched.current || generatingDesc) return;
    const name = editing.name.trim();
    if (name.length < 6 || editing.description.trim()) return;
    if (name === lastGenKey.current) return;
    const t = setTimeout(() => {
      lastGenKey.current = name;
      void runGenerateDesc(
        {
          name,
          categoryId: editing.categoryId,
          subcategoryId: editing.subcategoryId,
          type: editing.type,
          price: editing.price,
          description: "",
        },
        1
      );
    }, 2500);
    return () => clearTimeout(t);
  }, [editing, generatingDesc, runGenerateDesc]);

  const generateDescNow = () => {
    if (!editing || !editing.name.trim()) {
      toast.error("Type a product name first");
      return;
    }
    variationRef.current += 1;
    descTouched.current = false; // fresh AI text may replace what's there
    lastGenKey.current = editing.name.trim();
    setSeoInfo(null);
    void runGenerateDesc(
      {
        name: editing.name,
        categoryId: editing.categoryId,
        subcategoryId: editing.subcategoryId,
        type: editing.type,
        price: editing.price,
        description: editing.description,
      },
      variationRef.current
    );
  };

  const openNew = () => {
    catTouched.current = false;
    lastDetectKey.current = "";
    setDetectedLabel(null);
    descTouched.current = false;
    lastGenKey.current = "";
    variationRef.current = 1;
    setSeoInfo(null);
    setEditing({ ...emptyProduct, categoryId: "" });
    setImgUrlInput("");
    setEditOpen(true);
  };

  const openEdit = (p: Product) => {
    catTouched.current = true; // existing products: never override their category automatically
    lastDetectKey.current = "";
    setDetectedLabel(null);
    descTouched.current = true; // existing products: never auto-rewrite their description
    lastGenKey.current = "";
    variationRef.current = 1;
    setSeoInfo(null);
    setEditing({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price === null ? "" : String(p.price),
      oldPrice: p.oldPrice === null ? "" : String(p.oldPrice),
      type: p.type,
      categoryId: p.categoryId,
      subcategoryId: p.subcategoryId ?? "",
      images: [...p.images],
      specs: p.specs.map((s) => ({ ...s })),
      options: p.options.map((o) => ({ ...o, values: [...o.values] })),
      badge: p.badge ?? "",
      stock: String(p.stock),
      featured: p.featured,
    });
    setImgUrlInput("");
    setEditOpen(true);
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim()) return toast.error("Product name is required");
    if (!editing.categoryId && editing.id) return toast.error("Select a category");
    if (!editing.description.trim()) return toast.error("Description is required");
    if ((editing.type === "BUY_NOW" || editing.type === "BOTH") && !editing.price)
      return toast.error("Buy Now needs a price — enter a price or switch the type to Custom Order");
    if (editing.images.length === 0) return toast.error("Add at least one product image");

    const slug = editing.slug.trim() || slugify(editing.name);
    if (!slug) return toast.error("Could not generate a slug from this name");

    setSaving(true);
    try {
      await adminSaveProduct({
        id: editing.id,
        name: editing.name.trim(),
        slug,
        description: editing.description.trim(),
        price: editing.price ? Number(editing.price) : null,
        oldPrice: editing.oldPrice ? Number(editing.oldPrice) : null,
        type: editing.type,
        categoryId: editing.categoryId,
        subcategoryId: editing.subcategoryId || null,
        images: editing.images,
        specs: editing.specs.filter((s) => s.label && s.value),
        options: editing.options.filter((o) => o.label && o.values.filter(Boolean).length > 0),
        badge: editing.badge.trim() || null,
        stock: Number(editing.stock) || 0,
        featured: editing.featured,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["products"] }),
        queryClient.invalidateQueries({ queryKey: ["categories"] }),
      ]);
      const refreshedCategories = await fetchCategories();
      setCats(refreshedCategories);
      queryClient.setQueryData(["categories"], refreshedCategories);
      toast.success(editing.id ? "Product updated" : "Product created");
      setEditOpen(false);
      await load();
    } catch (e) {
      toast.error("Save failed", { description: e instanceof Error ? e.message : "" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return;
    setUploadingImg(true);
    try {
      const { urls } = await uploadImages(files);
      setEditing((e) => (e ? { ...e, images: [...e.images, ...urls] } : e));
      toast.success(files.length === 1 ? "Image uploaded" : `${files.length} images uploaded`);
    } catch (e) {
      toast.error("Upload failed", { description: e instanceof Error ? e.message : "" });
    } finally {
      setUploadingImg(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-900">Products</h1>
          <p className="mt-1 text-sm text-zinc-500">{products.length} products in catalog</p>
        </div>
        <Button className="font-bold" onClick={openNew}>
          <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" /> Add Product
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 border-b pb-3" role="tablist" aria-label="Product management sections">
        <button
          type="button"
          role="tab"
          aria-selected={section === "products"}
          onClick={() => setSection("products")}
          className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${section === "products" ? "bg-primary text-primary-foreground" : "border bg-white text-zinc-600 hover:border-primary/50 hover:text-primary"}`}
        >
          Products ({products.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={section === "categories"}
          onClick={() => setSection("categories")}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors ${section === "categories" ? "bg-primary text-primary-foreground" : "border bg-white text-zinc-600 hover:border-primary/50 hover:text-primary"}`}
        >
          <Tags className="h-4 w-4" aria-hidden="true" /> Categories ({cats.length})
        </button>
      </div>

      {section === "products" ? (
        <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" className="pl-9" />
        </div>
        {selectedProductIds.size > 0 && (
          <Button variant="destructive" onClick={() => setBulkDeleteOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" /> Delete selected ({selectedProductIds.size})
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b bg-zinc-50 text-left text-xs uppercase tracking-wider text-zinc-500">
                <th className="w-10 px-4 py-3">
                  <Checkbox
                      checked={allFilteredSelected}
                      onCheckedChange={(checked) => {
                        setSelectedProductIds((current) => {
                          const next = new Set(current);
                          for (const p of filtered) {
                            if (checked) next.add(p.id);
                            else next.delete(p.id);
                          }
                          return next;
                        });
                    }}
                    aria-label={allFilteredSelected ? "Deselect all filtered products" : "Select all filtered products"}
                  />
                </th>
                <th className="px-4 py-3 font-bold">Product</th>
                <th className="px-4 py-3 font-bold">Category</th>
                <th className="px-4 py-3 font-bold">Type</th>
                <th className="px-4 py-3 font-bold">Price</th>
                <th className="px-4 py-3 font-bold">Stock</th>
                <th className="px-4 py-3 font-bold">Featured</th>
                <th className="px-4 py-3 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                        <td colSpan={8} className="px-4 py-3">
                        <Skeleton className="h-10 w-full" />
                      </td>
                    </tr>
                  ))
                : filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-50/60">
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedProductIds.has(p.id)}
                          onCheckedChange={(checked) => toggleProduct(p.id, Boolean(checked))}
                          aria-label={`Select ${p.name}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          { }
                          <img src={p.images[0]} alt={p.name} className="h-11 w-11 rounded-lg border object-cover" />
                          <div className="min-w-0">
                            <button onClick={() => navigate(`/product/${p.slug}`)} className="line-clamp-1 text-left font-bold text-zinc-800 hover:text-primary">
                              {p.name}
                            </button>
                            <p className="font-mono text-xs text-zinc-400">{p.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-600">{p.category?.name ?? "—"}</td>
                      <td className="px-4 py-3">
                        {p.type === "BUY_NOW" ? (
                          <Badge className="bg-primary text-primary-foreground hover:bg-primary">Buy Now</Badge>
                        ) : p.type === "BOTH" ? (
                          <span className="inline-flex items-center gap-1">
                            <Badge className="bg-primary text-primary-foreground hover:bg-primary">Buy Now</Badge>
                            <Badge variant="secondary" className="border border-primary/40 bg-zinc-950 text-primary hover:bg-zinc-950">Custom</Badge>
                          </span>
                        ) : (
                          <Badge variant="secondary" className="border border-primary/40 bg-zinc-950 text-primary hover:bg-zinc-950">Custom</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold text-zinc-800">
                        {p.price === null ? <span className="text-zinc-400">Quote</span> : formatPKR(p.price)}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">{p.type === "CUSTOM_ORDER" ? "—" : p.stock}</td>
                      <td className="px-4 py-3">
                        {p.featured ? <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" /> : <span className="text-zinc-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)} aria-label={`Edit ${p.name}`}>
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => setDeleteTarget(p)} aria-label={`Delete ${p.name}`}>
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-zinc-400">
                    No products match “{search}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      ) : (
        <AdminProductCategories
          categories={cats}
          onChanged={async () => {
            await Promise.all([
              fetchCategories().then(setCats),
              queryClient.invalidateQueries({ queryKey: ["categories"] }),
            ]);
          }}
        />
      )}

      {/* ---------- Editor dialog ---------- */}
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditOpen(false)}>
        <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] sm:max-w-5xl overflow-y-auto scrollbar-thin">
          {editing && (
            <>
              <DialogHeader>
                <DialogTitle>{editing.id ? "Edit Product" : "Add New Product"}</DialogTitle>
                <DialogDescription>
                  Buy Now items appear in the cart/checkout flow; Custom Order items use the quote flow.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Product Name *</Label>
                  <Input
                    value={editing.name}
                    onChange={(e) =>
                      setEditing((s) =>
                        s
                          ? !s.id
                            ? { ...s, name: e.target.value, slug: slugify(e.target.value) }
                            : { ...s, name: e.target.value }
                          : s
                      )
                    }
                    placeholder="e.g. LED Edge-Lit Name Plate"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Slug (URL)</Label>
                  <Input value={editing.slug} onChange={(e) => setEditing((s) => (s ? { ...s, slug: slugify(e.target.value) } : s))} placeholder="auto-generated" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label>Category *</Label>
                    <div className="flex items-center gap-2">
                      {detecting && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-primary">
                          <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> Detecting…
                        </span>
                      )}
                      {!detecting && detectedLabel && !editing.id && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-primary">
                          <Sparkles className="h-3 w-3" aria-hidden="true" /> Auto-assigned
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={detectNow}
                        disabled={detecting || !editing.name.trim()}
                        className="flex items-center gap-1 rounded-md border border-primary/40 px-2 py-0.5 text-[11px] font-bold text-primary transition-colors hover:bg-accent disabled:opacity-40"
                      >
                        {detecting ? (
                          <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                        ) : (
                          <Sparkles className="h-3 w-3" aria-hidden="true" />
                        )}
                        Detect
                      </button>
                    </div>
                  </div>
                  <Select
                    value={editing.categoryId}
                    onValueChange={(v) => {
                      catTouched.current = true;
                      setDetectedLabel(null);
                      setEditing((s) => (s ? { ...s, categoryId: v, subcategoryId: "" } : s));
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Auto-detected from name" />
                    </SelectTrigger>
                    <SelectContent>
                      {cats.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-zinc-400">
                    Auto-detected from the product name — pick manually only if needed.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>Subcategory</Label>
                  <Select
                    value={editing.subcategoryId || "none"}
                    onValueChange={(v) => setEditing((s) => (s ? { ...s, subcategoryId: v === "none" ? "" : v } : s))}
                    disabled={!editing.subcategoryId && (cats.find((c) => c.id === editing.categoryId)?.subcategories?.length ?? 0) === 0}
                  >
                    <SelectTrigger className="w-full"><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No subcategory</SelectItem>
                      {(cats.find((c) => c.id === editing.categoryId)?.subcategories ?? []).map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-zinc-400">Auto-filled with the category — powers the Shop menu filters.</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Type *</Label>
                  <Select value={editing.type} onValueChange={(v: "BUY_NOW" | "CUSTOM_ORDER" | "BOTH") => setEditing((s) => (s ? { ...s, type: v } : s))}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BOTH">Buy Now + Custom (cart &amp; quote)</SelectItem>
                      <SelectItem value="BUY_NOW">Buy Now (cart + checkout)</SelectItem>
                      <SelectItem value="CUSTOM_ORDER">Custom Order (quote only)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-zinc-400">“Buy Now + Custom” shows both an Add to Cart button and a Request Quote option on the product page.</p>
                </div>
                <div className="space-y-1.5">
                  <Label>
                    Price (Rs){" "}
                    {editing.type === "CUSTOM_ORDER" ? (
                      <span className="text-zinc-400">— blank for quote-based</span>
                    ) : (
                      <span className="text-amber-600">* required for Buy Now</span>
                    )}
                  </Label>
                  <Input type="number" min={0} value={editing.price} onChange={(e) => setEditing((s) => (s ? { ...s, price: e.target.value } : s))} placeholder="e.g. 3500" />
                </div>
                <div className="space-y-1.5">
                  <Label>Old Price (Rs, optional)</Label>
                  <Input type="number" min={0} value={editing.oldPrice} onChange={(e) => setEditing((s) => (s ? { ...s, oldPrice: e.target.value } : s))} placeholder="e.g. 4200" />
                </div>
                <div className="space-y-1.5">
                  <Label>Stock {editing.type === "CUSTOM_ORDER" && "(unused)"}</Label>
                  <Input type="number" min={0} value={editing.stock} onChange={(e) => setEditing((s) => (s ? { ...s, stock: e.target.value } : s))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Badge (e.g. Best Seller)</Label>
                  <Input value={editing.badge} onChange={(e) => setEditing((s) => (s ? { ...s, badge: e.target.value } : s))} placeholder="Best Seller, New…" />
                </div>
                <div className="space-y-1.5">
                  <Label>Featured on home page</Label>
                  <div className="flex h-10 items-center">
                    <Switch checked={editing.featured} onCheckedChange={(v) => setEditing((s) => (s ? { ...s, featured: v } : s))} aria-label="Featured" />
                  </div>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label>Description *</Label>
                    <div className="flex items-center gap-2">
                      {generatingDesc && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-primary">
                          <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> Writing…
                        </span>
                      )}
                      {!generatingDesc && seoInfo?.method === "ai" && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-primary">
                          <Sparkles className="h-3 w-3" aria-hidden="true" /> AI-written
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={generateDescNow}
                        disabled={generatingDesc || !editing.name.trim()}
                        className="flex items-center gap-1 rounded-md border border-primary/40 px-2 py-0.5 text-[11px] font-bold text-primary transition-colors hover:bg-accent disabled:opacity-40"
                      >
                        {generatingDesc ? (
                          <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                        ) : (
                          <Wand2 className="h-3 w-3" aria-hidden="true" />
                        )}
                        {editing.description.trim() ? "Regenerate" : "Write with AI"}
                      </button>
                    </div>
                  </div>
                  <Textarea
                    rows={8}
                    value={editing.description}
                    onChange={(e) => {
                      descTouched.current = true;
                      setSeoInfo(null);
                      setEditing((s) => (s ? { ...s, description: e.target.value } : s));
                    }}
                    placeholder="AI writes this automatically from the product name — or type your own notes and hit Write with AI."
                  />
                  {seoInfo ? (
                    <p className="flex items-start gap-1 text-xs text-zinc-400">
                      <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-primary" aria-hidden="true" />
                      <span>
                        SEO-ready: {seoInfo.wordCount} words · keywords: {seoInfo.keywords.slice(0, 4).join(", ")}
                        {seoInfo.keywords.length > 4 ? ` +${seoInfo.keywords.length - 4} more` : ""}
                      </span>
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-400">
                      Auto-written from the product name with ranking keywords — edit freely.
                    </p>
                  )}
                </div>

                {/* Images */}
                <div className="space-y-2 sm:col-span-2">
                  <Label>Images * (first image is the main one)</Label>
                  <div className="flex flex-wrap gap-3">
                    {editing.images.map((img, i) => (
                      <div key={i} className="group relative h-24 w-24 overflow-hidden rounded-lg border">
                        { }
                        <img src={img} alt={`Product image ${i + 1}`} className="h-full w-full object-cover" />
                        <button
                          onClick={() => setEditing((s) => (s ? { ...s, images: s.images.filter((_, j) => j !== i) } : s))}
                          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                          aria-label="Remove image"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        {i === 0 && (
                          <span className="absolute bottom-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">MAIN</span>
                        )}
                      </div>
                    ))}
                    <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed text-zinc-400 hover:border-primary/50 hover:text-primary">
                      {uploadingImg ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Upload className="h-5 w-5" aria-hidden="true" />}
                      <span className="text-[10px] font-semibold">{uploadingImg ? "Uploading…" : "Upload"}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files ?? []);
                          if (files.length > 0) void handleUpload(files);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <Input value={imgUrlInput} onChange={(e) => setImgUrlInput(e.target.value)} placeholder="…or paste image URL (e.g. /images/p-example.png)" />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (!imgUrlInput.trim()) return;
                        setEditing((s) => (s ? { ...s, images: [...s.images, imgUrlInput.trim()] } : s));
                        setImgUrlInput("");
                      }}
                    >
                      Add URL
                    </Button>
                  </div>
                </div>

                {/* Specs editor */}
                <div className="space-y-2 sm:col-span-2">
                  <Label>Specifications</Label>
                  {editing.specs.map((spec, i) => (
                    <div key={i} className="flex gap-2">
                      <Input placeholder="Label (e.g. Material)" value={spec.label} onChange={(e) => setEditing((s) => s ? { ...s, specs: s.specs.map((sp, j) => j === i ? { ...sp, label: e.target.value } : sp) } : s)} />
                      <Input placeholder="Value (e.g. 8mm acrylic)" value={spec.value} onChange={(e) => setEditing((s) => s ? { ...s, specs: s.specs.map((sp, j) => j === i ? { ...sp, value: e.target.value } : sp) } : s)} />
                      <Button type="button" variant="ghost" size="icon" onClick={() => setEditing((s) => s ? { ...s, specs: s.specs.filter((_, j) => j !== i) } : s)} aria-label="Remove spec">
                        <Trash2 className="h-4 w-4 text-red-500" aria-hidden="true" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditing((s) => s ? { ...s, specs: [...s.specs, { label: "", value: "" }] } : s)}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Add Spec
                  </Button>
                </div>

                {/* Options editor */}
                <div className="space-y-2 sm:col-span-2">
                  <Label>Options (size / color choices)</Label>
                  {editing.options.map((opt, i) => (
                    <div key={i} className="space-y-1.5 rounded-lg border p-3">
                      <div className="flex gap-2">
                        <Input placeholder="Option label (e.g. Size)" value={opt.label} onChange={(e) => setEditing((s) => s ? { ...s, options: s.options.map((o, j) => j === i ? { ...o, label: e.target.value } : o) } : s)} />
                        <Button type="button" variant="ghost" size="icon" onClick={() => setEditing((s) => s ? { ...s, options: s.options.filter((_, j) => j !== i) } : s)} aria-label="Remove option">
                          <Trash2 className="h-4 w-4 text-red-500" aria-hidden="true" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Values, comma-separated (e.g. Small, Medium, Large)"
                        value={opt.values.join(", ")}
                        onChange={(e) =>
                          setEditing((s) =>
                            s
                              ? {
                                  ...s,
                                  options: s.options.map((o, j) =>
                                    j === i ? { ...o, values: e.target.value.split(",").map((v) => v.trim()).filter(Boolean) } : o
                                  ),
                                }
                              : s
                          )
                        }
                      />
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditing((s) => s ? { ...s, options: [...s.options, { label: "", values: [] }] } : s)}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Add Option
                  </Button>
                </div>
              </div>

              <div className="mt-2 flex justify-end gap-3 border-t pt-4">
                <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button onClick={save} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                  {editing.id ? "Save Changes" : "Create Product"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ---------- Delete confirm ---------- */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleteTarget?.name}” will be permanently removed from the shop. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (!deleteTarget) return;
                try {
                  await adminDeleteProduct(deleteTarget.id);
                  await Promise.all([
                    queryClient.invalidateQueries({ queryKey: ["products"] }),
                    queryClient.invalidateQueries({ queryKey: ["categories"] }),
                  ]);
                  const refreshedCategories = await fetchCategories();
                  setCats(refreshedCategories);
                  queryClient.setQueryData(["categories"], refreshedCategories);
                  toast.success("Product deleted");
                  setProducts((ps) => ps.filter((p) => p.id !== deleteTarget.id));
                  setSelectedProductIds((ids) => {
                    const next = new Set(ids);
                    next.delete(deleteTarget.id);
                    return next;
                  });
                } catch {
                  toast.error("Delete failed");
                } finally {
                  setDeleteTarget(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={(open) => !bulkDeleting && setBulkDeleteOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedProductIds.size} selected products?</AlertDialogTitle>
            <AlertDialogDescription>
              These products will be permanently removed from the shop. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={(event) => {
              event.preventDefault();
              void deleteSelected();
            }} disabled={bulkDeleting}>
              {bulkDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              Delete Products
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AdminProductCategories({
  categories,
  onChanged,
}: {
  categories: Category[];
  onChanged: () => Promise<void>;
}) {
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [saving, setSaving] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const openNew = () => {
    setCategoryOpen(true);
    setEditing(null);
    setName("");
    setSlug("");
    setDescription("");
    setImage("");
    setSortOrder(String(categories.length + 1));
  };

  const openEdit = (category: Category) => {
    setCategoryOpen(true);
    setEditing(category);
    setName(category.name);
    setSlug(category.slug);
    setDescription(category.description ?? "");
    setImage(category.image ?? "");
    setSortOrder(String(category.sortOrder));
  };

  const save = async () => {
    if (!name.trim()) return toast.error("Category name is required");
    setSaving(true);
    try {
      await adminSaveCategory({
        id: editing?.id,
        name: name.trim(),
        slug: slug.trim() || slugify(name),
        description: description.trim() || null,
        image: image.trim() || null,
        sortOrder: Number(sortOrder) || 0,
      });
      toast.success(editing ? "Category updated" : "Category created");
      setEditing(null);
      setName("");
      setCategoryOpen(false);
      await onChanged();
    } catch (e) {
      toast.error("Category save failed", { description: e instanceof Error ? e.message : "" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await adminDeleteCategory(deleteTarget.id);
      toast.success("Category deleted");
      setDeleteTarget(null);
      await onChanged();
    } catch (e) {
      toast.error("Could not delete category", { description: e instanceof Error ? e.message : "" });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-zinc-900">Product Categories</h2>
          <p className="mt-1 text-sm text-zinc-500">Manage the categories and subcategories used in the shop.</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-1.5 h-4 w-4" aria-hidden="true" /> Add Category</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => (
          <section key={category.id} className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate font-display text-base font-bold text-zinc-900">{category.name}</h3>
                <p className="mt-0.5 font-mono text-xs text-zinc-400">/{category.slug}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(category)} aria-label={`Edit ${category.name}`}>
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => setDeleteTarget(category)} aria-label={`Delete ${category.name}`}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
            {category.description && <p className="mt-3 line-clamp-2 text-sm text-zinc-500">{category.description}</p>}
            <div className="mt-4 border-t pt-3">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                {category.productCount ?? 0} products · {category.subcategories?.length ?? 0} subcategories
              </p>
              {!!category.subcategories?.length && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {category.subcategories.map((subcategory) => (
                    <Badge key={subcategory.id} variant="secondary" className="font-medium">
                      {subcategory.name} ({subcategory.productCount ?? 0})
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </section>
        ))}
        {categories.length === 0 && <p className="col-span-full rounded-xl border bg-white p-10 text-center text-sm text-zinc-400">No product categories yet. Add one to organize the shop.</p>}
      </div>

      <Dialog open={categoryOpen} onOpenChange={(open) => {
        if (!open && !saving) {
          setCategoryOpen(false);
          setEditing(null);
          setName("");
        }
      }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Category" : "Add Category"}</DialogTitle>
            <DialogDescription>Categories organize products and appear in the public shop navigation.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Category Name *</Label>
              <Input value={name} onChange={(event) => {
                setName(event.target.value);
                if (!editing) setSlug(slugify(event.target.value));
              }} placeholder="e.g. LED Signs" />
            </div>
            <div className="space-y-1.5">
              <Label>URL Slug</Label>
              <Input value={slug} onChange={(event) => setSlug(slugify(event.target.value))} placeholder="led-signs" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Short description for this category" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Image URL</Label>
                <Input value={image} onChange={(event) => setImage(event.target.value)} placeholder="/images/category.png" />
              </div>
              <div className="space-y-1.5">
                <Label>Sort Order</Label>
                <Input type="number" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} placeholder="1" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setCategoryOpen(false); setEditing(null); setName(""); }} disabled={saving}>Cancel</Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              {editing ? "Save Changes" : "Create Category"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Only empty categories can be deleted. Move or delete its products and subcategories first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={(event) => {
              event.preventDefault();
              void remove();
            }}>Delete Category</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
