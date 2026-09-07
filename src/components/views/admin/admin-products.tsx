"use client";

/**
 * Admin — Products management (add/edit/delete, images, categories, type, stock).
 */
import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  Upload,
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
import { adminDeleteProduct, adminFetchProducts, adminSaveProduct, fetchCategories, uploadImage } from "@/lib/api";
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
  type: "BUY_NOW" | "CUSTOM_ORDER";
  categoryId: string;
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
  type: "CUSTOM_ORDER",
  categoryId: "",
  images: [],
  specs: [],
  options: [],
  badge: "",
  stock: "10",
  featured: false,
};

export function AdminProducts() {
  const { navigate } = useRoute();
  const [products, setProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [imgUrlInput, setImgUrlInput] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [ps, cs] = await Promise.all([adminFetchProducts(), fetchCategories()]);
      setProducts(ps);
      setCats(cs);
    } catch (e) {
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

  const openNew = () => {
    setEditing({ ...emptyProduct, categoryId: cats[0]?.id ?? "" });
    setImgUrlInput("");
    setEditOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price === null ? "" : String(p.price),
      oldPrice: p.oldPrice === null ? "" : String(p.oldPrice),
      type: p.type,
      categoryId: p.categoryId,
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
    if (!editing.categoryId) return toast.error("Select a category");
    if (!editing.description.trim()) return toast.error("Description is required");
    if (editing.type === "BUY_NOW" && !editing.price) return toast.error("Buy Now products need a price");
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
        images: editing.images,
        specs: editing.specs.filter((s) => s.label && s.value),
        options: editing.options.filter((o) => o.label && o.values.filter(Boolean).length > 0),
        badge: editing.badge.trim() || null,
        stock: Number(editing.stock) || 0,
        featured: editing.featured,
      });
      toast.success(editing.id ? "Product updated" : "Product created");
      setEditOpen(false);
      await load();
    } catch (e) {
      toast.error("Save failed", { description: e instanceof Error ? e.message : "" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (file: File) => {
    setUploadingImg(true);
    try {
      const { url } = await uploadImage(file);
      setEditing((e) => (e ? { ...e, images: [...e.images, url] } : e));
      toast.success("Image uploaded");
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

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" className="pl-9" />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b bg-zinc-50 text-left text-xs uppercase tracking-wider text-zinc-500">
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
                      <td colSpan={7} className="px-4 py-3">
                        <Skeleton className="h-10 w-full" />
                      </td>
                    </tr>
                  ))
                : filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-50/60">
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
                          <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Buy Now</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">Custom</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold text-zinc-800">
                        {p.price === null ? <span className="text-zinc-400">Quote</span> : formatPKR(p.price)}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">{p.type === "BUY_NOW" ? p.stock : "—"}</td>
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
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-zinc-400">
                    No products match “{search}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------- Editor dialog ---------- */}
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditOpen(false)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto scrollbar-thin">
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
                        s && !s.id ? { ...s, name: e.target.value, slug: slugify(e.target.value) } : { ...s, name: e.target.value }
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
                  <Label>Category *</Label>
                  <Select value={editing.categoryId} onValueChange={(v) => setEditing((s) => (s ? { ...s, categoryId: v } : s))}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {cats.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Type *</Label>
                  <Select value={editing.type} onValueChange={(v: "BUY_NOW" | "CUSTOM_ORDER") => setEditing((s) => (s ? { ...s, type: v } : s))}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BUY_NOW">Buy Now (cart + checkout)</SelectItem>
                      <SelectItem value="CUSTOM_ORDER">Custom Order (quote only)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Price (Rs) {editing.type === "CUSTOM_ORDER" && <span className="text-zinc-400">— blank for quote-based</span>}</Label>
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
                  <Label>Description *</Label>
                  <Textarea rows={4} value={editing.description} onChange={(e) => setEditing((s) => (s ? { ...s, description: e.target.value } : s))} />
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
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUpload(f);
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
                  toast.success("Product deleted");
                  setProducts((ps) => ps.filter((p) => p.id !== deleteTarget.id));
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
    </div>
  );
}
