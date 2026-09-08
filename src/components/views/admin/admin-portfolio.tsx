"use client";

/**
 * Admin panel — Portfolio management.
 * Structure mirrors the Clients panel: projects are grouped into category
 * cards (parent) with a nested, scrollable project list (children) — each
 * category has rename / delete actions and its own "Add Project" button,
 * and every project row has reorder / edit / delete controls.
 * Changes go live on the website immediately.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Tag,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  adminDeletePortfolioCategory,
  adminDeletePortfolioItem,
  adminFetchPortfolio,
  adminRenamePortfolioCategory,
  adminSavePortfolioItem,
  uploadImage,
} from "@/lib/api";
import { useContent } from "@/lib/content";

type ItemRow = {
  id: string;
  title: string;
  client: string;
  city: string;
  category: string;
  image: string;
  description: string;
  sortOrder: number;
};

type EditState = {
  id?: string;
  title: string;
  client: string;
  city: string;
  category: string;
  image: string;
  description: string;
  sortOrder: string;
};

type CategoryGroup = { category: string; items: ItemRow[] };

type RenameTarget = { category: string; count: number; name: string };

type CategoryDeleteTarget = { category: string; count: number };

const emptyItem: EditState = {
  title: "",
  client: "",
  city: "",
  category: "",
  image: "",
  description: "",
  sortOrder: "",
};

export function AdminPortfolio() {
  const [rows, setRows] = useState<ItemRow[] | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ItemRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // category rename / delete (parent actions, like the client card buttons)
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<RenameTarget | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [deleteCatTarget, setDeleteCatTarget] = useState<CategoryDeleteTarget | null>(null);

  const { refresh, portfolio } = useContent();

  const load = useCallback(async () => {
    try {
      const data = await adminFetchPortfolio();
      setRows(data as ItemRow[]);
    } catch {
      toast.error("Could not load portfolio items");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** Group the globally-ordered rows into category cards (first-appearance order). */
  const groups = useMemo<CategoryGroup[]>(() => {
    const map = new Map<string, ItemRow[]>();
    for (const p of rows ?? []) {
      const cat = p.category || "Other";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    }
    return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
  }, [rows]);

  const categories = Array.from(
    new Set([...(rows ?? []), ...portfolio].map((p) => p.category).filter(Boolean))
  );

  // ---------- project CRUD ----------

  const openNew = (category?: string) => {
    setEditing({ ...emptyItem, ...(category ? { category } : {}) });
    setEditOpen(true);
  };

  const openEdit = (p: ItemRow) => {
    setEditing({
      id: p.id,
      title: p.title,
      client: p.client,
      city: p.city,
      category: p.category,
      image: p.image,
      description: p.description,
      sortOrder: String(p.sortOrder),
    });
    setEditOpen(true);
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim()) {
      toast.error("Project title is required");
      return;
    }
    if (!editing.image.trim()) {
      toast.error("Upload or paste a project image first");
      return;
    }
    if (!editing.category.trim()) {
      toast.error("Pick or type a category for this project");
      return;
    }
    setSaving(true);
    try {
      await adminSavePortfolioItem({
        id: editing.id,
        title: editing.title.trim(),
        client: editing.client.trim(),
        city: editing.city.trim(),
        category: editing.category.trim() || "Other",
        image: editing.image.trim(),
        description: editing.description.trim(),
        sortOrder: editing.sortOrder ? Number(editing.sortOrder) : undefined,
      });
      toast.success(editing.id ? "Project saved — website updated" : "Project added — now live on the website");
      setEditOpen(false);
      setEditing(null);
      await load();
      await refresh(); // push live content to the whole site instantly
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save project");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await adminDeletePortfolioItem(deleteTarget.id);
      toast.success(`"${deleteTarget.title}" removed from the website`);
      setDeleteTarget(null);
      await load();
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete project");
    }
  };

  /** Reorder within a category: swap global positions with the nearest same-category neighbor. */
  const move = async (p: ItemRow, dir: -1 | 1) => {
    if (!rows) return;
    const i = rows.findIndex((r) => r.id === p.id);
    if (i < 0) return;
    let j = -1;
    if (dir === -1) {
      for (let k = i - 1; k >= 0; k--) {
        if (rows[k].category === p.category) { j = k; break; }
      }
    } else {
      for (let k = i + 1; k < rows.length; k++) {
        if (rows[k].category === p.category) { j = k; break; }
      }
    }
    if (j < 0) return;

    const itemI = rows[i]; // moving item
    const itemJ = rows[j]; // same-category neighbor it swaps with
    const next = [...rows];
    next[i] = { ...itemJ, sortOrder: i + 1 };
    next[j] = { ...itemI, sortOrder: j + 1 };
    setRows(next);
    try {
      await adminSavePortfolioItem({ id: itemJ.id, title: itemJ.title, sortOrder: i + 1 });
      await adminSavePortfolioItem({ id: itemI.id, title: itemI.title, sortOrder: j + 1 });
      await refresh();
    } catch {
      toast.error("Could not reorder");
      await load();
    }
  };

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const { url } = await uploadImage(file);
      setEditing((s) => (s ? { ...s, image: url } : s));
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // ---------- category rename / delete ----------

  const openRename = (g: CategoryGroup) => {
    setRenameTarget({ category: g.category, count: g.items.length, name: g.category });
    setRenameOpen(true);
  };

  const rename = async () => {
    if (!renameTarget) return;
    const name = renameTarget.name.trim();
    if (!name) {
      toast.error("Category name is required");
      return;
    }
    setRenaming(true);
    try {
      const res = await adminRenamePortfolioCategory(renameTarget.category, name);
      toast.success(
        res.updated > 0
          ? `Category renamed — ${res.updated} project${res.updated === 1 ? "" : "s"} updated on the website`
          : "Category renamed"
      );
      setRenameOpen(false);
      setRenameTarget(null);
      await load();
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not rename category");
    } finally {
      setRenaming(false);
    }
  };

  const removeCategory = async () => {
    if (!deleteCatTarget) return;
    try {
      await adminDeletePortfolioCategory(deleteCatTarget.category);
      toast.success(
        `"${deleteCatTarget.category}" and its ${deleteCatTarget.count} project${
          deleteCatTarget.count === 1 ? "" : "s"
        } removed from the website`
      );
      setDeleteCatTarget(null);
      await load();
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete category");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-900">Portfolio</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Projects grouped by category — shown on the Portfolio page filter chips, the navbar
            Portfolio menu and the homepage &ldquo;Recent Projects&rdquo; section.
          </p>
        </div>
        <Button className="font-bold" onClick={() => openNew()}>
          <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" /> Add Project
        </Button>
      </div>

      {/* Category cards with nested project lists — client-panel style */}
      {rows === null ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center text-sm text-zinc-400 shadow-sm">
          No portfolio projects yet — add your first one.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {groups.map((g) => (
            <section key={g.category} className="min-w-0 rounded-2xl border bg-white shadow-sm">
              {/* header: category name + rename / delete */}
              <div className="flex items-center gap-3 border-b p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-accent text-primary">
                  <Tag className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-base font-bold text-zinc-900">{g.category}</p>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                    {g.items.length} project{g.items.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openRename(g)}
                    aria-label={`Rename ${g.category} category`}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:bg-red-50"
                    onClick={() => setDeleteCatTarget({ category: g.category, count: g.items.length })}
                    aria-label={`Delete ${g.category} category`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              {/* projects list */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500">
                    <ImageIcon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    Projects ({g.items.length})
                  </p>
                  <button
                    onClick={() => openNew(g.category)}
                    className="flex items-center gap-1 rounded-md border border-primary/40 px-2 py-0.5 text-[11px] font-bold text-primary transition-colors hover:bg-accent"
                  >
                    <Plus className="h-3 w-3" aria-hidden="true" /> Add Project
                  </button>
                </div>
                <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto scrollbar-thin">
                  {g.items.map((p, idx) => (
                    <li
                      key={p.id}
                      className="group flex items-center gap-3 rounded-lg border bg-zinc-50/60 p-2"
                    >
                      <span className="flex h-11 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-white">
                        {p.image ? (
                          <img src={p.image} alt={p.title} className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-zinc-300" aria-hidden="true" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-zinc-800">{p.title}</p>
                        <p className="truncate text-xs text-zinc-400">
                          {p.client || "—"}
                          {p.city ? ` · ${p.city}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          onClick={() => void move(p, -1)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-white hover:text-primary disabled:opacity-30"
                          aria-label={`Move ${p.title} up`}
                          disabled={idx === 0}
                        >
                          <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => void move(p, 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-white hover:text-primary disabled:opacity-30"
                          aria-label={`Move ${p.title} down`}
                          disabled={idx === g.items.length - 1}
                        >
                          <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => openEdit(p)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-white hover:text-primary"
                          aria-label={`Edit ${p.title}`}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Delete ${p.title}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>
      )}

      {/* ---------- Project editor dialog ---------- */}
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditOpen(false)}>
        <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] sm:max-w-3xl overflow-y-auto scrollbar-thin">
          {editing && (
            <>
              <DialogHeader>
                <DialogTitle>{editing.id ? "Edit Project" : "Add Project"}</DialogTitle>
                <DialogDescription>
                  Shown in the portfolio gallery, homepage recent projects and the navbar Portfolio
                  menu — saved changes go live immediately.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Image */}
                <div className="space-y-2">
                  <Label>Project Image *</Label>
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="h-28 w-40 shrink-0 overflow-hidden rounded-lg border bg-zinc-100">
                      {editing.image ? (
                        <img src={editing.image} alt="Project preview" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-zinc-300">
                          <Upload className="h-6 w-6" aria-hidden="true" />
                        </span>
                      )}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-dashed px-4 text-sm font-semibold text-zinc-500 hover:border-primary/50 hover:text-primary">
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Upload className="h-4 w-4" aria-hidden="true" />}
                        Upload image
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) void upload(f);
                            e.currentTarget.value = "";
                          }}
                        />
                      </label>
                      <Input
                        value={editing.image}
                        onChange={(e) => setEditing((s) => (s ? { ...s, image: e.target.value } : s))}
                        placeholder="…or paste image URL"
                        className="w-56"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Project Title *</Label>
                    <Input
                      value={editing.title}
                      onChange={(e) => setEditing((s) => (s ? { ...s, title: e.target.value } : s))}
                      placeholder="e.g. 3D Illuminated Restaurant Signage"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Client</Label>
                    <Input
                      value={editing.client}
                      onChange={(e) => setEditing((s) => (s ? { ...s, client: e.target.value } : s))}
                      placeholder="e.g. Karahi Khaja Corner"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>City</Label>
                    <Input
                      value={editing.city}
                      onChange={(e) => setEditing((s) => (s ? { ...s, city: e.target.value } : s))}
                      placeholder="e.g. Lahore"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Category *</Label>
                    <Input
                      value={editing.category}
                      onChange={(e) => setEditing((s) => (s ? { ...s, category: e.target.value } : s))}
                      placeholder="e.g. Restaurant"
                      list="portfolio-category-options"
                    />
                    <datalist id="portfolio-category-options">
                      {categories.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                    <p className="text-xs text-zinc-400">
                      Existing categories: {categories.slice(0, 6).join(", ") || "—"}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Sort Order</Label>
                    <Input
                      type="number"
                      min={1}
                      value={editing.sortOrder}
                      onChange={(e) => setEditing((s) => (s ? { ...s, sortOrder: e.target.value } : s))}
                      placeholder="auto"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea
                    rows={4}
                    value={editing.description}
                    onChange={(e) => setEditing((s) => (s ? { ...s, description: e.target.value } : s))}
                    placeholder="Short project story — shown in the portfolio lightbox."
                  />
                </div>
              </div>

              <div className="mt-2 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button className="font-bold" onClick={save} disabled={saving}>
                  {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />}
                  {editing.id ? "Save Changes" : "Add Project"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ---------- Category rename dialog ---------- */}
      <Dialog open={renameOpen} onOpenChange={(o) => !o && setRenameOpen(false)}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md">
          {renameTarget && (
            <>
              <DialogHeader>
                <DialogTitle>Rename Category</DialogTitle>
                <DialogDescription>
                  Renames &ldquo;{renameTarget.category}&rdquo; across its {renameTarget.count} project
                  {renameTarget.count === 1 ? "" : "s"} — the portfolio filter chip and service page
                  sections update instantly.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-1.5">
                <Label>Category Name *</Label>
                <Input
                  value={renameTarget.name}
                  onChange={(e) => setRenameTarget((s) => (s ? { ...s, name: e.target.value } : s))}
                  placeholder="e.g. Restaurant"
                  autoFocus
                />
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setRenameOpen(false)}>Cancel</Button>
                <Button className="font-bold" onClick={rename} disabled={renaming}>
                  {renaming && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />}
                  Save Name
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete project confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.title}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the project from the portfolio page and homepage immediately. This cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 font-bold text-white hover:bg-red-700"
              onClick={() => void remove()}
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete category confirmation */}
      <AlertDialog open={!!deleteCatTarget} onOpenChange={(o) => !o && setDeleteCatTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteCatTarget?.category}?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes the category and all {deleteCatTarget?.count ?? 0} project
              {(deleteCatTarget?.count ?? 0) === 1 ? "" : "s"} in it from the website immediately.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 font-bold text-white hover:bg-red-700"
              onClick={() => void removeCategory()}
            >
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
