"use client";

/**
 * Admin — Clients management for the homepage "Our Clients" section.
 * Add/edit/delete clients (round logo) and their projects (shown on logo click).
 */
import { useEffect, useRef, useState } from "react";
import {
  Briefcase,
  Images,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
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
  adminDeleteClient,
  adminDeleteClientProject,
  adminFetchClients,
  adminGenerateProjectDescription,
  adminSaveClient,
  adminSaveClientProject,
  uploadImages,
} from "@/lib/api";
import type { GenerateDescriptionResponse } from "@/lib/api";
import { slugify } from "@/lib/format";
import { useContent } from "@/lib/content";
import type { Client, ClientProject } from "@/lib/types";

type ClientEdit = {
  id?: string;
  name: string;
  slug: string;
  logo: string;
  industry: string;
};

type ProjectEdit = {
  id?: string;
  clientId: string;
  clientName: string;
  title: string;
  description: string;
  images: string[];
  portfolioCategories: string[];
  year: string;
};

const emptyClient: ClientEdit = { name: "", slug: "", logo: "", industry: "" };

export function AdminClients() {
  const { portfolioCategories } = useContent();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // client dialog
  const [clientOpen, setClientOpen] = useState(false);
  const [clientEdit, setClientEdit] = useState<ClientEdit | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [deleteClient, setDeleteClient] = useState<Client | null>(null);

  // project dialog
  const [projectOpen, setProjectOpen] = useState(false);
  const [projectEdit, setProjectEdit] = useState<ProjectEdit | null>(null);
  const [uploadingProjImg, setUploadingProjImg] = useState(false);
  const [projImgUrlInput, setProjImgUrlInput] = useState("");
  const [deleteProject, setDeleteProject] = useState<ClientProject | null>(null);

  // project description AI writer
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [projSeoInfo, setProjSeoInfo] = useState<GenerateDescriptionResponse | null>(null);
  const projDescTouched = useRef(false);
  const projLastGenKey = useRef("");
  const projVariationRef = useRef(1);

  const load = async () => {
    setLoading(true);
    try {
      setClients(await adminFetchClients());
    } catch {
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ---------- client CRUD ----------

  const openNewClient = () => {
    setClientEdit({ ...emptyClient });
    setClientOpen(true);
  };

  const openEditClient = (c: Client) => {
    setClientEdit({ id: c.id, name: c.name, slug: c.slug, logo: c.logo, industry: c.industry ?? "" });
    setClientOpen(true);
  };

  const saveClient = async () => {
    if (!clientEdit) return;
    if (!clientEdit.name.trim()) return toast.error("Client name is required");
    if (!clientEdit.logo.trim()) return toast.error("Upload or paste a client logo image");
    setSaving(true);
    try {
      await adminSaveClient({
        id: clientEdit.id,
        name: clientEdit.name.trim(),
        slug: clientEdit.slug.trim(),
        logo: clientEdit.logo.trim(),
        industry: clientEdit.industry.trim() || null,
      });
      toast.success(clientEdit.id ? "Client updated" : "Client added");
      setClientOpen(false);
      await load();
    } catch (e) {
      toast.error("Save failed", { description: e instanceof Error ? e.message : "" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (files: File[]) => {
    if (files.length === 0) return;
    setUploadingLogo(true);
    try {
      const { urls } = await uploadImages(files);
      setClientEdit((s) => (s ? { ...s, logo: urls[0] ?? s.logo } : s));
      toast.success(files.length === 1 ? "Logo uploaded" : `${files.length} images uploaded; first image selected as logo`);
    } catch (e) {
      toast.error("Upload failed", { description: e instanceof Error ? e.message : "" });
    } finally {
      setUploadingLogo(false);
    }
  };

  // ---------- project CRUD ----------

  /** AI-write a long SEO case-study description and fill the textarea. */
  const runGenerateProjDesc = async (src: ProjectEdit, variation: number) => {
    setGeneratingDesc(true);
    try {
      // short existing text = the admin's notes → use as hints for the writer
      const notes = src.description.trim();
      const hints = notes.length > 0 && notes.length < 120 ? notes : undefined;
      const res = await adminGenerateProjectDescription({
        clientId: src.clientId,
        clientName: src.clientName,
        title: src.title.trim(),
        year: src.year ? Number(src.year) : null,
        hints,
        imageUrl: src.images[0] ?? null,
        variation,
      });
      setProjectEdit((s) => (s ? { ...s, description: res.description } : s));
      setProjSeoInfo(res);
      if (res.method === "ai") {
        toast.success("AI wrote a long SEO case study", {
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
  };

  const openNewProject = (c: Client) => {
    projDescTouched.current = false;
    projLastGenKey.current = "";
    projVariationRef.current = 1;
    setProjSeoInfo(null);
    setProjImgUrlInput("");
    setProjectEdit({
      clientId: c.id,
      clientName: c.name,
      title: "",
      description: "",
      images: [],
      portfolioCategories: [],
      year: String(new Date().getFullYear()),
    });
    setProjectOpen(true);
  };

  const openEditProject = (c: Client, p: ClientProject) => {
    projDescTouched.current = true; // never auto-overwrite an existing story
    projLastGenKey.current = p.title;
    projVariationRef.current = 1;
    setProjSeoInfo(null);
    setProjImgUrlInput("");
    setProjectEdit({
      id: p.id,
      clientId: c.id,
      clientName: c.name,
      title: p.title,
      description: p.description,
      images: [...p.images],
      portfolioCategories: p.portfolioCategories ?? [],
      year: p.year ? String(p.year) : "",
    });
    setProjectOpen(true);
  };

  const generateProjDescNow = () => {
    if (!projectEdit || !projectEdit.title.trim()) {
      return toast.error("Type a project title first");
    }
    projVariationRef.current += 1;
    projDescTouched.current = false; // fresh AI text may replace what's there
    projLastGenKey.current = projectEdit.title.trim();
    setProjSeoInfo(null);
    void runGenerateProjDesc(projectEdit, projVariationRef.current);
  };

  // Auto-write the long description for a NEW project once the title settles
  // (debounced 2.5s, only while empty, never after manual typing or a failed attempt)
  useEffect(() => {
    if (!projectEdit || projectEdit.id || projDescTouched.current || generatingDesc) return;
    const title = projectEdit.title.trim();
    if (title.length < 6 || projectEdit.description.trim() || projectEdit.images.length === 0) return;
    if (title === projLastGenKey.current) return;
    const t = setTimeout(() => {
      projLastGenKey.current = title;
      void runGenerateProjDesc(projectEdit, 1);
    }, 2500);
    return () => clearTimeout(t);
  }, [projectEdit, generatingDesc]);

  const saveProject = async () => {
    if (!projectEdit) return;
    if (!projectEdit.title.trim()) return toast.error("Project title is required");
    if (!projectEdit.description.trim()) return toast.error("Project description is required");
    if (projectEdit.images.length === 0) return toast.error("Upload at least one project image");
    setSaving(true);
    try {
      await adminSaveClientProject({
        id: projectEdit.id,
        clientId: projectEdit.clientId,
        title: projectEdit.title.trim(),
        description: projectEdit.description.trim(),
        images: projectEdit.images,
        portfolioCategories: projectEdit.portfolioCategories,
        year: projectEdit.year ? Number(projectEdit.year) : null,
      });
      toast.success(projectEdit.id ? "Project updated" : "Project added");
      setProjectOpen(false);
      await load();
    } catch (e) {
      toast.error("Save failed", { description: e instanceof Error ? e.message : "" });
    } finally {
      setSaving(false);
    }
  };

  const handleProjectImgUpload = async (files: File[]) => {
    if (files.length === 0) return;
    setUploadingProjImg(true);
    try {
      const { urls } = await uploadImages(files);
      setProjectEdit((s) => (s ? { ...s, images: [...s.images, ...urls] } : s));
      toast.success(files.length === 1 ? "Image uploaded" : `${files.length} images uploaded`);
    } catch (e) {
      toast.error("Upload failed", { description: e instanceof Error ? e.message : "" });
    } finally {
      setUploadingProjImg(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-900">Clients</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Shown on the homepage — click a logo on the site to view that client&apos;s projects.
          </p>
        </div>
        <Button className="font-bold" onClick={openNewClient}>
          <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" /> Add Client
        </Button>
      </div>

      {/* Client cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center text-sm text-zinc-400 shadow-sm">
          No clients yet — add your first client to show their logo on the homepage.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {clients.map((c) => (
            <section key={c.id} className="min-w-0 rounded-2xl border bg-white shadow-sm">
              {/* header: round logo + name */}
              <div className="flex items-center gap-3 border-b p-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-zinc-200 bg-white">
                  <img src={c.logo} alt={`${c.name} logo`} className="h-full w-full object-cover" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-base font-bold text-zinc-900">{c.name}</p>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                    {c.industry || "—"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditClient(c)} aria-label={`Edit ${c.name}`}>
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => setDeleteClient(c)} aria-label={`Delete ${c.name}`}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              {/* projects list */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500">
                    <Briefcase className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    Projects ({c.projects.length})
                  </p>
                  <button
                    onClick={() => openNewProject(c)}
                    className="flex items-center gap-1 rounded-md border border-primary/40 px-2 py-0.5 text-[11px] font-bold text-primary transition-colors hover:bg-accent"
                  >
                    <Plus className="h-3 w-3" aria-hidden="true" /> Add Project
                  </button>
                </div>
                <ul className="mt-3 max-h-44 space-y-2 overflow-y-auto scrollbar-thin">
                  {c.projects.length === 0 && (
                    <li className="py-3 text-center text-xs text-zinc-400">No projects yet.</li>
                  )}
                  {c.projects.map((p) => (
                    <li
                      key={p.id}
                      className="group flex items-center gap-3 rounded-lg border bg-zinc-50/60 p-2"
                    >
                      <span className="relative shrink-0">
                        <img src={p.images[0]} alt={p.title} className="h-11 w-14 rounded-md border object-cover" />
                        {p.images.length > 1 && (
                          <span className="absolute -right-1.5 -top-1.5 flex items-center gap-0.5 rounded-full bg-zinc-900 px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
                            <Images className="h-2.5 w-2.5" aria-hidden="true" />
                            {p.images.length}
                          </span>
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-zinc-800">{p.title}</p>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
                          <span>{p.year ?? "—"}</span>
                          {(p.portfolioCategories ?? []).map((category) => (
                            <Badge key={category} variant="secondary" className="px-1.5 py-0 text-[10px]">{category}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          onClick={() => openEditProject(c, p)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-white hover:text-primary"
                          aria-label={`Edit ${p.title}`}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => setDeleteProject(p)}
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

      {/* ---------- Client dialog ---------- */}
      <Dialog open={clientOpen} onOpenChange={(o) => !o && setClientOpen(false)}>
        <DialogContent className="sm:max-w-2xl">
          {clientEdit && (
            <>
              <DialogHeader>
                <DialogTitle>{clientEdit.id ? "Edit Client" : "Add Client"}</DialogTitle>
                <DialogDescription>The logo appears in a round frame on the homepage.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* logo preview + upload */}
                <div className="flex items-center gap-4">
                  <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-zinc-200 bg-white">
                    {clientEdit.logo ? (
                      <img src={clientEdit.logo} alt="Client logo preview" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-semibold text-zinc-300">LOGO</span>
                    )}
                  </span>
                  <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-dashed px-4 text-sm font-semibold text-zinc-500 hover:border-primary/50 hover:text-primary">
                    {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Upload className="h-4 w-4" aria-hidden="true" />}
                    Upload logo
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files ?? []);
                        if (files.length > 0) void handleLogoUpload(files);
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>
                </div>
                <div className="space-y-1.5">
                  <Label>Logo URL</Label>
                  <Input
                    value={clientEdit.logo}
                    onChange={(e) => setClientEdit((s) => (s ? { ...s, logo: e.target.value } : s))}
                    placeholder="/images/client-cafe-mocha.png"
                  />
                  <p className="text-xs text-zinc-400">Upload a square image — it is shown in a circle.</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Client Name *</Label>
                  <Input
                    value={clientEdit.name}
                    onChange={(e) =>
                      setClientEdit((s) =>
                        s ? { ...s, name: e.target.value, ...(s.id ? {} : { slug: slugify(e.target.value) }) } : s
                      )
                    }
                    placeholder="e.g. Cafe Mocha"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Case Study URL</Label>
                  <div className="flex items-center gap-1.5">
                    <span className="shrink-0 font-mono text-xs text-zinc-400">/casestudy/portfolio/</span>
                    <Input
                      value={clientEdit.slug}
                      onChange={(e) => setClientEdit((s) => (s ? { ...s, slug: slugify(e.target.value) } : s))}
                      placeholder="auto-from-name"
                      className="font-mono text-xs"
                    />
                  </div>
                  <p className="text-xs text-zinc-400">Where this client&apos;s logo click takes visitors. Auto-filled from the name.</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Industry</Label>
                  <Input
                    value={clientEdit.industry}
                    onChange={(e) => setClientEdit((s) => (s ? { ...s, industry: e.target.value } : s))}
                    placeholder="e.g. Food & Beverage, Healthcare"
                  />
                </div>
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setClientOpen(false)}>Cancel</Button>
                <Button className="font-bold" onClick={saveClient} disabled={saving}>
                  {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />}
                  {clientEdit.id ? "Save Changes" : "Add Client"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ---------- Project dialog ---------- */}
      <Dialog open={projectOpen} onOpenChange={(o) => !o && setProjectOpen(false)}>
        <DialogContent className="max-h-[90vh] sm:max-w-3xl overflow-y-auto scrollbar-thin">
          {projectEdit && (
            <>
              <DialogHeader>
                <DialogTitle>{projectEdit.id ? "Edit Project" : "Add Project"}</DialogTitle>
                <DialogDescription>
                  Shown when a visitor clicks <span className="font-semibold">{projectEdit.clientName}</span>&apos;s logo on the homepage.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* images — multiple, first is the main one */}
                <div className="space-y-2">
                  <Label>Project Images * (first image is the main one)</Label>
                  <div className="flex flex-wrap gap-3">
                    {projectEdit.images.map((img, i) => (
                      <div key={`${img}-${i}`} className="group relative h-20 w-28 overflow-hidden rounded-lg border">
                        <img src={img} alt={`Project image ${i + 1}`} className="h-full w-full object-cover" />
                        <button
                          onClick={() =>
                            setProjectEdit((s) => (s ? { ...s, images: s.images.filter((_, j) => j !== i) } : s))
                          }
                          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                          aria-label={`Remove image ${i + 1}`}
                        >
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        {i === 0 && (
                          <span className="absolute bottom-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                            MAIN
                          </span>
                        )}
                      </div>
                    ))}
                    <label className="flex h-20 w-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-zinc-400 hover:border-primary/50 hover:text-primary">
                      {uploadingProjImg ? (
                        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                      ) : (
                        <Upload className="h-5 w-5" aria-hidden="true" />
                      )}
                      <span className="text-[10px] font-semibold">
                        {uploadingProjImg ? "Uploading…" : "Upload"}
                      </span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files ?? []);
                          if (files.length > 0) void handleProjectImgUpload(files);
                          e.currentTarget.value = "";
                        }}
                      />
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={projImgUrlInput}
                      onChange={(e) => setProjImgUrlInput(e.target.value)}
                      placeholder="…or paste image URL (e.g. /images/proj-cafe.png)"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && projImgUrlInput.trim()) {
                          e.preventDefault();
                          setProjectEdit((s) => (s ? { ...s, images: [...s.images, projImgUrlInput.trim()] } : s));
                          setProjImgUrlInput("");
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (!projImgUrlInput.trim()) return;
                        setProjectEdit((s) => (s ? { ...s, images: [...s.images, projImgUrlInput.trim()] } : s));
                        setProjImgUrlInput("");
                      }}
                    >
                      Add URL
                    </Button>
                  </div>
                  {projectEdit.images.length > 1 && (
                    <p className="text-xs text-zinc-400">
                      {projectEdit.images.length} images — visitors can browse them as a gallery on the case study page.
                    </p>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Project Title *</Label>
                    <Input
                      value={projectEdit.title}
                      onChange={(e) => setProjectEdit((s) => (s ? { ...s, title: e.target.value } : s))}
                      placeholder="e.g. Illuminated Storefront & Brand Sign"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Year</Label>
                    <Input
                      type="number"
                      min={1900}
                      max={2200}
                      value={projectEdit.year}
                      onChange={(e) => setProjectEdit((s) => (s ? { ...s, year: e.target.value } : s))}
                      placeholder={String(new Date().getFullYear())}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Portfolio Categories</Label>
                  <div className="grid max-h-44 gap-2 overflow-y-auto rounded-md border bg-zinc-50 p-3 sm:grid-cols-2">
                    {portfolioCategories.filter((category) => category !== "All").map((category) => {
                      const selected = projectEdit.portfolioCategories.includes(category);
                      return (
                        <label key={category} className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={(event) => setProjectEdit((s) => {
                              if (!s) return s;
                              const categories = new Set(s.portfolioCategories);
                              if (event.target.checked) categories.add(category);
                              else categories.delete(category);
                              return { ...s, portfolioCategories: [...categories] };
                            })}
                            className="h-4 w-4 accent-primary"
                          />
                          {category}
                        </label>
                      );
                    })}
                  </div>
                  <p className="text-xs text-zinc-400">Select every portfolio category where this project should appear. Leave unchecked to show it only under All.</p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label>Project Description *</Label>
                    <div className="flex items-center gap-2">
                      {generatingDesc && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-primary">
                          <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> Writing…
                        </span>
                      )}
                      {!generatingDesc && projSeoInfo?.method === "ai" && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-primary">
                          <Sparkles className="h-3 w-3" aria-hidden="true" /> AI-written
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={generateProjDescNow}
                        disabled={generatingDesc || !projectEdit.title.trim() || projectEdit.images.length === 0}
                        className="flex items-center gap-1 rounded-md border border-primary/40 px-2 py-0.5 text-[11px] font-bold text-primary transition-colors hover:bg-accent disabled:opacity-40"
                      >
                        {generatingDesc ? (
                          <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                        ) : (
                          <Wand2 className="h-3 w-3" aria-hidden="true" />
                        )}
                        {projectEdit.description.trim() ? "Match to image" : "Describe image"}
                      </button>
                    </div>
                  </div>
                  <Textarea
                    rows={10}
                    value={projectEdit.description}
                    onChange={(e) => {
                      projDescTouched.current = true;
                      setProjSeoInfo(null);
                      setProjectEdit((s) => (s ? { ...s, description: e.target.value } : s));
                    }}
                    placeholder="AI writes a full, SEO-optimized case study (350-450 words) from the project title — or type your own notes and hit Write with AI."
                  />
                  {projSeoInfo ? (
                    <p className="flex items-start gap-1 text-xs text-zinc-400">
                      <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-primary" aria-hidden="true" />
                      <span>
                        SEO-ready: {projSeoInfo.wordCount} words · keywords: {projSeoInfo.keywords.slice(0, 4).join(", ")}
                        {projSeoInfo.keywords.length > 4 ? ` +${projSeoInfo.keywords.length - 4} more` : ""}
                      </span>
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-400">
                      Add a project image, then use “Describe image” or “Match to image” to write a picture-aware case study.
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setProjectOpen(false)}>Cancel</Button>
                <Button className="font-bold" onClick={saveProject} disabled={saving}>
                  {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />}
                  {projectEdit.id ? "Save Changes" : "Add Project"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ---------- Delete confirmations ---------- */}
      <AlertDialog open={!!deleteClient} onOpenChange={(o) => !o && setDeleteClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteClient?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This also deletes their {deleteClient?.projects.length ?? 0} project
              {(deleteClient?.projects.length ?? 0) === 1 ? "" : "s"}. The logo disappears from the homepage immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (!deleteClient) return;
                try {
                  await adminDeleteClient(deleteClient.id);
                  toast.success("Client deleted");
                  setDeleteClient(null);
                  await load();
                } catch {
                  toast.error("Delete failed");
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteProject} onOpenChange={(o) => !o && setDeleteProject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleteProject?.title}” will no longer be shown with this client&apos;s logo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (!deleteProject) return;
                try {
                  await adminDeleteClientProject(deleteProject.id);
                  toast.success("Project deleted");
                  setDeleteProject(null);
                  await load();
                } catch {
                  toast.error("Delete failed");
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
