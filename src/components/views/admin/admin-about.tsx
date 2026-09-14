"use client";

import { useEffect, useState } from "react";
import { ImagePlus, Loader2, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminGetSettings, adminUpdateSettings, uploadImages } from "@/lib/api";

const defaultAbout = {
  heroTitle: "The sign-makers behind Pakistan's brightest brands",
  heroText: "For over 12 years, Madni Advertiser has designed, fabricated and installed signage that helps businesses get noticed.",
  storyTitle: "Started with one flex printer. Still obsessed with craft.",
  storyText: "Madni Advertiser began in Lahore as a small printing setup with a simple belief: every business deserves a sign it is proud of.",
  mission: "Make signs that make businesses shine — and keep them shining with honest after-sales service.",
  images: ["/images/about-workshop.png", "/images/about-team.png"],
};

type AboutSettings = typeof defaultAbout;

export function AdminAbout() {
  const [about, setAbout] = useState<AboutSettings>(defaultAbout);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    adminGetSettings()
      .then((data) => setAbout({ ...defaultAbout, ...(data.settings.about as Partial<AboutSettings> | undefined) }))
      .catch(() => toast.error("Could not load About Us content"))
      .finally(() => setLoading(false));
  }, []);

  const update = (key: keyof Omit<AboutSettings, "images">, value: string) => {
    setAbout((current) => ({ ...current, [key]: value }));
  };

  const uploadAboutImages = async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    try {
      const { urls } = await uploadImages(files);
      setAbout((current) => ({ ...current, images: [...current.images, ...urls] }));
      toast.success(`${urls.length} image${urls.length === 1 ? "" : "s"} uploaded`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await adminUpdateSettings({ settings: { about } });
      toast.success("About Us saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save About Us");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" aria-label="Loading About Us" /></div>;

  return <div className="max-w-4xl space-y-6">
    <div><h1 className="font-display text-2xl font-bold text-zinc-900">About Us</h1><p className="mt-1 text-sm text-zinc-500">Edit the content and images shown on your public About Us page.</p></div>

    <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6"><div className="mb-5 flex items-center gap-3 border-b pb-4"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-primary"><ImagePlus className="h-4 w-4" aria-hidden="true" /></span><h2 className="font-display text-lg font-bold text-zinc-900">About Us content</h2></div><div className="space-y-4"><Field label="Hero title" value={about.heroTitle} onChange={(value) => update("heroTitle", value)} /><TextAreaField label="Hero text" value={about.heroText} onChange={(value) => update("heroText", value)} /><Field label="Story title" value={about.storyTitle} onChange={(value) => update("storyTitle", value)} /><TextAreaField label="Story text" value={about.storyText} onChange={(value) => update("storyText", value)} /><TextAreaField label="Mission statement" value={about.mission} onChange={(value) => update("mission", value)} /></div></section>

    <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6"><div className="mb-5 flex items-center gap-3 border-b pb-4"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-primary"><ImagePlus className="h-4 w-4" aria-hidden="true" /></span><h2 className="font-display text-lg font-bold text-zinc-900">About Us images</h2></div><div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2">{about.images.map((image, index) => <div key={`${image}-${index}`} className="relative overflow-hidden rounded-xl border bg-zinc-50"><img src={image} alt={`About Us image ${index + 1}`} className="aspect-[16/10] w-full object-cover" /><Button type="button" variant="outline" size="icon" onClick={() => setAbout((current) => ({ ...current, images: current.images.filter((_, imageIndex) => imageIndex !== index) }))} className="absolute right-2 top-2 bg-white/90 text-red-600 hover:bg-red-50 hover:text-red-700" aria-label={`Remove About Us image ${index + 1}`}><Trash2 className="h-4 w-4" aria-hidden="true" /></Button></div>)}</div><label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-accent/30 px-4 py-6 text-sm font-bold text-primary hover:bg-accent"><Upload className="h-5 w-5" aria-hidden="true" />{uploading ? "Uploading..." : "Upload About Us images"}<input type="file" accept="image/*" multiple className="sr-only" disabled={uploading} onChange={(event) => { const files = Array.from(event.target.files ?? []); event.target.value = ""; void uploadAboutImages(files); }} /></label></div></section>

    <div className="flex justify-end"><Button type="button" onClick={save} disabled={saving} className="bg-primary font-bold text-primary-foreground hover:bg-primary/90">{saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />} Save About Us</Button></div>
  </div>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const id = `about-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return <div className="space-y-1.5"><Label htmlFor={id}>{label}</Label><Input id={id} value={value} onChange={(event) => onChange(event.target.value)} /></div>;
}

function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const id = `about-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return <div className="space-y-1.5"><Label htmlFor={id}>{label}</Label><Textarea id={id} value={value} onChange={(event) => onChange(event.target.value)} rows={4} /></div>;
}
