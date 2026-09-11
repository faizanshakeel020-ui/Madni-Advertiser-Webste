"use client";

/**
 * Admin panel — Services management.
 * Structure mirrors the Clients panel: each service is a card with a header
 * (hero thumb, name, tagline, reorder/edit/delete) and a nested, scrollable
 * sub-services list with its own "Add Sub-Service" button — sub-services are
 * added/edited/removed through a dedicated dialog, exactly like client projects.
 * Changes go live on the website immediately.
 */
import { useCallback, useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Briefcase,
  Image as ImageIcon,
  Layers,
  Loader2,
  Pencil,
  Plus,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  adminAddServiceSub,
  adminDeleteService,
  adminDeleteServiceSub,
  adminFetchServices,
  adminSaveService,
  adminUpdateServiceSub,
  uploadImages,
} from "@/lib/api";
import { useContent } from "@/lib/content";
import { slugify } from "@/lib/format";
import type { ServiceSub } from "@/lib/types";

type ServiceRow = {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  hero: string;
  icon: string;
  subServices: ServiceSub[];
  projectTags: string[];
  sortOrder: number;
};

type EditState = {
  id?: string;
  name: string;
  slug: string;
  shortName: string;
  tagline: string;
  description: string;
  hero: string;
  icon: string;
  tagsInput: string;
  sortOrder: string;
};

/** Sub-service dialog state — index undefined = adding a new one. */
type SubEdit = {
  serviceId: string;
  serviceName: string;
  index?: number;
  name: string;
  description: string;
  image: string;
};

type SubDeleteTarget = {
  serviceId: string;
  serviceName: string;
  index: number;
  name: string;
};

const ICON_OPTIONS = [
  { value: "building", label: "Building (outdoor)" },
  { value: "door", label: "Door (indoor)" },
  { value: "monitor", label: "Monitor (digital)" },
  { value: "store", label: "Store (retail)" },
  { value: "presentation", label: "Presentation (exhibition)" },
];

const emptyService: EditState = {
  name: "",
  slug: "",
  shortName: "",
  tagline: "",
  description: "",
  hero: "",
  icon: "building",
  tagsInput: "",
  sortOrder: "",
};

export function AdminServices() {
  const [rows, setRows] = useState<ServiceRow[] | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ServiceRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);

  // sub-service dialog (like the client-project dialog)
  const [subOpen, setSubOpen] = useState(false);
  const [subEdit, setSubEdit] = useState<SubEdit | null>(null);
  const [savingSub, setSavingSub] = useState(false);
  const [uploadingSub, setUploadingSub] = useState(false);
  const [deleteSubTarget, setDeleteSubTarget] = useState<SubDeleteTarget | null>(null);

  const { refresh } = useContent();

  const load = useCallback(async () => {
    try {
      const data = await adminFetchServices();
      setRows(data as ServiceRow[]);
    } catch {
      toast.error("Could not load services");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // ---------- service CRUD ----------

  const openNew = () => {
    setEditing({ ...emptyService });
    setEditOpen(true);
  };

  const openEdit = (s: ServiceRow) => {
    setEditing({
      id: s.id,
      name: s.name,
      slug: s.slug,
      shortName: s.shortName,
      tagline: s.tagline,
      description: s.description,
      hero: s.hero,
      icon: s.icon,
      tagsInput: s.projectTags.join(", "),
      sortOrder: String(s.sortOrder),
    });
    setEditOpen(true);
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      toast.error("Service name is required");
      return;
    }
    setSaving(true);
    try {
      await adminSaveService({
        id: editing.id,
        name: editing.name.trim(),
        slug: editing.slug,
        shortName: editing.shortName.trim() || editing.name.trim(),
        tagline: editing.tagline.trim(),
        description: editing.description.trim(),
        hero: editing.hero.trim(),
        icon: editing.icon,
        // sub-services are managed from the card — not sent here (API keeps the stored list)
        projectTags: editing.tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        sortOrder: editing.sortOrder ? Number(editing.sortOrder) : undefined,
      });
      toast.success(editing.id ? "Service saved — website updated" : "Service added — now live on the website");
      setEditOpen(false);
      setEditing(null);
      await load();
      await refresh(); // push live content to the whole site instantly
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save service");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await adminDeleteService(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" removed from the website`);
      setDeleteTarget(null);
      await load();
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete service");
    }
  };

  const move = async (s: ServiceRow, dir: -1 | 1) => {
    if (!rows) return;
    const i = rows.findIndex((r) => r.id === s.id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    setRows(next);
    try {
      await adminSaveService({ id: next[i].id, name: next[i].name, sortOrder: i + 1 });
      await adminSaveService({ id: next[j].id, name: next[j].name, sortOrder: j + 1 });
      await refresh();
    } catch {
      toast.error("Could not reorder");
      await load();
    }
  };

  const uploadHero = async (files: File[]) => {
    if (files.length === 0) return;
    setUploadingHero(true);
    try {
      const { urls } = await uploadImages(files);
      setEditing((s) => (s ? { ...s, hero: urls[0] ?? s.hero } : s));
      toast.success(files.length === 1 ? "Hero image uploaded" : `${files.length} images uploaded; first image selected`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploadingHero(false);
    }
  };

  // ---------- sub-service CRUD (from the service card, like client projects) ----------

  const openNewSub = (s: ServiceRow) => {
    setSubEdit({ serviceId: s.id, serviceName: s.name, name: "", description: "", image: "" });
    setSubOpen(true);
  };

  const openEditSub = (s: ServiceRow, sub: ServiceSub, index: number) => {
    setSubEdit({
      serviceId: s.id,
      serviceName: s.name,
      index,
      name: sub.name,
      description: sub.description,
      image: sub.image,
    });
    setSubOpen(true);
  };

  const uploadSub = async (files: File[]) => {
    if (files.length === 0) return;
    setUploadingSub(true);
    try {
      const { urls } = await uploadImages(files);
      setSubEdit((s) => (s ? { ...s, image: urls[0] ?? s.image } : s));
      toast.success(files.length === 1 ? "Image uploaded" : `${files.length} images uploaded; first image selected`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploadingSub(false);
    }
  };

  const saveSub = async () => {
    if (!subEdit) return;
    if (!subEdit.name.trim()) {
      toast.error("Sub-service name is required");
      return;
    }
    setSavingSub(true);
    try {
      const payload = {
        name: subEdit.name.trim(),
        description: subEdit.description.trim(),
        image: subEdit.image.trim(),
      };
      if (subEdit.index !== undefined) {
        await adminUpdateServiceSub(subEdit.serviceId, subEdit.index, payload);
        toast.success("Sub-service saved — website updated");
      } else {
        await adminAddServiceSub(subEdit.serviceId, payload);
        toast.success(`Added to ${subEdit.serviceName} — now live on the website`);
      }
      setSubOpen(false);
      setSubEdit(null);
      await load();
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save sub-service");
    } finally {
      setSavingSub(false);
    }
  };

  const removeSub = async () => {
    if (!deleteSubTarget) return;
    try {
      await adminDeleteServiceSub(deleteSubTarget.serviceId, deleteSubTarget.index);
      toast.success(`"${deleteSubTarget.name}" removed from ${deleteSubTarget.serviceName}`);
      setDeleteSubTarget(null);
      await load();
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete sub-service");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-900">Services</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage the service pillars shown in the navbar menu, services pages, homepage and quote
            form — add sub-services straight from each card.
          </p>
        </div>
        <Button className="font-bold" onClick={openNew}>
          <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" /> Add Service
        </Button>
      </div>

      {/* List — client-panel style cards with nested sub-service lists */}
      {rows === null ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center text-sm text-zinc-400 shadow-sm">
          No services yet — add your first service pillar.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((s) => (
            <section key={s.id} className="min-w-0 rounded-2xl border bg-white shadow-sm">
              {/* header: hero thumb + name + actions */}
              <div className="flex flex-wrap items-center gap-3 border-b p-4">
                <span className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-zinc-100">
                  {s.hero ? (
                    <img src={s.hero} alt={`${s.name} hero`} className="h-full w-full object-cover" />
                  ) : (
                    <Briefcase className="h-6 w-6 text-zinc-300" aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-base font-bold text-zinc-900">{s.name}</p>
                  <p className="truncate text-xs font-medium uppercase tracking-wider text-zinc-400">
                    {s.tagline || s.slug}
                  </p>
                </div>
                <div className="flex basis-full items-center justify-end gap-0.5 border-t border-zinc-100 pt-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => move(s, -1)} aria-label="Move up" disabled={rows[0]?.id === s.id}>
                    <ArrowUp className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => move(s, 1)} aria-label="Move down" disabled={rows[rows.length - 1]?.id === s.id}>
                    <ArrowDown className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)} aria-label={`Edit ${s.name}`}>
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:bg-red-50"
                    onClick={() => setDeleteTarget(s)}
                    aria-label={`Delete ${s.name}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              {/* sub-services list */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500">
                    <Layers className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    Sub-Services ({s.subServices.length})
                  </p>
                  <button
                    onClick={() => openNewSub(s)}
                    className="flex items-center gap-1 rounded-md border border-primary/40 px-2 py-0.5 text-[11px] font-bold text-primary transition-colors hover:bg-accent"
                  >
                    <Plus className="h-3 w-3" aria-hidden="true" /> Add Sub-Service
                  </button>
                </div>
                <ul className="mt-3 max-h-44 space-y-2 overflow-y-auto scrollbar-thin">
                  {s.subServices.length === 0 && (
                    <li className="py-3 text-center text-xs text-zinc-400">
                      No sub-services yet — e.g. &ldquo;3D Sign Letters&rdquo;.
                    </li>
                  )}
                  {s.subServices.map((sub, i) => (
                    <li
                      key={`${s.id}-${i}`}
                      className="group flex items-center gap-3 rounded-lg border bg-zinc-50/60 p-2"
                    >
                      <span className="flex h-11 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-white">
                        {sub.image ? (
                          <img src={sub.image} alt={sub.name} className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-zinc-300" aria-hidden="true" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-zinc-800">{sub.name}</p>
                        <p className="truncate text-xs text-zinc-400">
                          {sub.description || "No description"}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          onClick={() => openEditSub(s, sub, i)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-white hover:text-primary"
                          aria-label={`Edit ${sub.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteSubTarget({
                              serviceId: s.id,
                              serviceName: s.name,
                              index: i,
                              name: sub.name,
                            })
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Delete ${sub.name}`}
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

      {/* ---------- Service editor dialog ---------- */}
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditOpen(false)}>
        <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] sm:max-w-3xl overflow-y-auto scrollbar-thin">
          {editing && (
            <>
              <DialogHeader>
                <DialogTitle>{editing.id ? "Edit Service" : "Add New Service"}</DialogTitle>
                <DialogDescription>
                  Appears in the navbar Services menu, the services pages, the homepage and the quote
                  form — saved changes go live immediately.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Service Name *</Label>
                  <Input
                    value={editing.name}
                    onChange={(e) =>
                      setEditing((s) =>
                        s ? { ...s, name: e.target.value, ...(s.id ? {} : { slug: slugify(e.target.value) }) } : s
                      )
                    }
                    placeholder="e.g. Outdoor Signage"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Short Name</Label>
                  <Input
                    value={editing.shortName}
                    onChange={(e) => setEditing((s) => (s ? { ...s, shortName: e.target.value } : s))}
                    placeholder="e.g. Outdoor"
                  />
                  <p className="text-xs text-zinc-400">Used in headings like &ldquo;Start your outdoor project&rdquo;.</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Slug (URL)</Label>
                  <Input
                    value={editing.slug}
                    onChange={(e) => setEditing((s) => (s ? { ...s, slug: slugify(e.target.value) } : s))}
                    placeholder="auto-generated"
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Tagline</Label>
                  <Input
                    value={editing.tagline}
                    onChange={(e) => setEditing((s) => (s ? { ...s, tagline: e.target.value } : s))}
                    placeholder="e.g. Big, bold and built for the weather"
                  />
                </div>

                {/* Hero image */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Hero Image</Label>
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="h-20 w-32 shrink-0 overflow-hidden rounded-lg border bg-zinc-100">
                      {editing.hero ? (
                        <img src={editing.hero} alt="Hero preview" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-zinc-300">
                          <Upload className="h-5 w-5" aria-hidden="true" />
                        </span>
                      )}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-dashed px-4 text-sm font-semibold text-zinc-500 hover:border-primary/50 hover:text-primary">
                        {uploadingHero ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Upload className="h-4 w-4" aria-hidden="true" />}
                        Upload image
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const files = Array.from(e.target.files ?? []);
                            if (files.length > 0) void uploadHero(files);
                            e.currentTarget.value = "";
                          }}
                        />
                      </label>
                      {editing.hero && (
                        <Button variant="ghost" size="sm" onClick={() => setEditing((s) => (s ? { ...s, hero: "" } : s))}>
                          Remove
                        </Button>
                      )}
                      <Input
                        value={editing.hero}
                        onChange={(e) => setEditing((s) => (s ? { ...s, hero: e.target.value } : s))}
                        placeholder="…or paste image URL"
                        className="w-56"
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    rows={5}
                    value={editing.description}
                    onChange={(e) => setEditing((s) => (s ? { ...s, description: e.target.value } : s))}
                    placeholder="What this service covers — shown on the service page hero and services overview."
                  />
                </div>

                {/* Icon */}
                <div className="space-y-1.5">
                  <Label>Icon</Label>
                  <Select value={editing.icon} onValueChange={(v) => setEditing((s) => (s ? { ...s, icon: v } : s))}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

                {/* Project tags */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Portfolio Categories to Show</Label>
                  <Input
                    value={editing.tagsInput}
                    onChange={(e) => setEditing((s) => (s ? { ...s, tagsInput: e.target.value } : s))}
                    placeholder="e.g. Restaurant, Retail, Hotel"
                  />
                  <p className="text-xs text-zinc-400">
                    Comma-separated portfolio categories — matching projects appear in the &ldquo;Example
                    Projects&rdquo; section of this service page.
                  </p>
                </div>

                <p className="rounded-lg border border-dashed bg-zinc-50/60 px-4 py-3 text-xs text-zinc-500 sm:col-span-2">
                  Sub-services (e.g. &ldquo;3D Sign Letters&rdquo;, &ldquo;Flex Face Signs&rdquo;) are added and
                  edited directly on the service card after saving — use the &ldquo;Add Sub-Service&rdquo; button
                  there.
                </p>
              </div>

              <div className="mt-2 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button className="font-bold" onClick={save} disabled={saving}>
                  {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />}
                  {editing.id ? "Save Changes" : "Add Service"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ---------- Sub-service dialog (like the client-project dialog) ---------- */}
      <Dialog open={subOpen} onOpenChange={(o) => !o && setSubOpen(false)}>
        <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] sm:max-w-2xl overflow-y-auto scrollbar-thin">
          {subEdit && (
            <>
              <DialogHeader>
                <DialogTitle>{subEdit.index !== undefined ? "Edit Sub-Service" : "Add Sub-Service"}</DialogTitle>
                <DialogDescription>
                  Part of <span className="font-semibold">{subEdit.serviceName}</span> — shown in the
                  navbar dropdown and the &ldquo;What&apos;s Included&rdquo; grid on its service page.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Image — preview + upload + URL, like the project dialog */}
                <div className="space-y-2">
                  <Label>Image</Label>
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="h-20 w-28 shrink-0 overflow-hidden rounded-lg border bg-zinc-100">
                      {subEdit.image ? (
                        <img src={subEdit.image} alt="Sub-service preview" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-zinc-300">
                          <Upload className="h-5 w-5" aria-hidden="true" />
                        </span>
                      )}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-dashed px-4 text-sm font-semibold text-zinc-500 hover:border-primary/50 hover:text-primary">
                        {uploadingSub ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Upload className="h-4 w-4" aria-hidden="true" />}
                        Upload image
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const files = Array.from(e.target.files ?? []);
                            if (files.length > 0) void uploadSub(files);
                            e.currentTarget.value = "";
                          }}
                        />
                      </label>
                      {subEdit.image && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSubEdit((s) => (s ? { ...s, image: "" } : s))}
                        >
                          Remove
                        </Button>
                      )}
                      <Input
                        value={subEdit.image}
                        onChange={(e) => setSubEdit((s) => (s ? { ...s, image: e.target.value } : s))}
                        placeholder="…or paste image URL"
                        className="w-56"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Sub-Service Name *</Label>
                  <Input
                    value={subEdit.name}
                    onChange={(e) => setSubEdit((s) => (s ? { ...s, name: e.target.value } : s))}
                    placeholder="e.g. 3D Sign Letters"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea
                    rows={5}
                    value={subEdit.description}
                    onChange={(e) => setSubEdit((s) => (s ? { ...s, description: e.target.value } : s))}
                    placeholder="Short description — shown under the sub-service name on the service page."
                  />
                </div>
              </div>

              <div className="mt-2 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSubOpen(false)}>Cancel</Button>
                <Button className="font-bold" onClick={saveSub} disabled={savingSub}>
                  {savingSub && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />}
                  {subEdit.index !== undefined ? "Save Changes" : "Add Sub-Service"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete service confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the service and its {deleteTarget?.subServices.length ?? 0} sub-service
              {(deleteTarget?.subServices.length ?? 0) === 1 ? "" : "s"} from the navbar menu, services
              page and homepage immediately. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 font-bold text-white hover:bg-red-700"
              onClick={() => void remove()}
            >
              Delete Service
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete sub-service confirmation */}
      <AlertDialog open={!!deleteSubTarget} onOpenChange={(o) => !o && setDeleteSubTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete sub-service?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleteSubTarget?.name}&rdquo; will be removed from{" "}
              {deleteSubTarget?.serviceName} on the website immediately. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 font-bold text-white hover:bg-red-700"
              onClick={() => void removeSub()}
            >
              Delete Sub-Service
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
