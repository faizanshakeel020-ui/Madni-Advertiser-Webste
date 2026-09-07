"use client";

/**
 * Reusable "Get a Quote" form — used on the quote page, service pages,
 * contact page and product detail (custom order items).
 */
import { useRef, useState } from "react";
import { CheckCircle2, ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WhatsAppIcon } from "./icons";
import { SITE, whatsappUrl } from "@/lib/constants";
import { SERVICES } from "@/lib/services-data";
import { createQuote, uploadImage } from "@/lib/api";

const SERVICE_OPTIONS = [
  ...SERVICES.map((s) => s.name),
  "Custom / Other Project",
  "General Inquiry",
];

export function QuoteForm({
  defaultService,
  productName,
  compact = false,
  title,
  onSubmitted,
}: {
  defaultService?: string;
  productName?: string;
  compact?: boolean;
  title?: string;
  onSubmitted?: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    service: defaultService ?? "",
    details: productName ? `Project: ${productName}\n\n` : "",
    city: "Lahore",
  });
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ reference: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large", { description: "Please upload an image under 5MB." });
      return;
    }
    setUploading(true);
    try {
      const { url } = await uploadImage(file);
      setImage(url);
      toast.success("Reference image attached");
    } catch (e) {
      toast.error("Upload failed", { description: e instanceof Error ? e.message : "Try again" });
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!form.name.trim() || form.name.trim().length < 2) {
      toast.error("Please enter your name");
      return;
    }
    if (!/^[+]?[0-9\s-]{10,15}$/.test(form.phone.trim())) {
      toast.error("Please enter a valid phone number");
      return;
    }
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!form.service) {
      toast.error("Please select a service you're interested in");
      return;
    }
    if (form.details.trim().length < 10) {
      toast.error("Please describe your project (at least a few words)");
      return;
    }
    setSubmitting(true);
    try {
      const res = await createQuote({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        service: form.service,
        productName,
        details: form.details.trim(),
        city: form.city,
        referenceImage: image ?? undefined,
      });
      setDone({ reference: res.reference });
      onSubmitted?.();
      toast.success("Quote request received!", {
        description: "Our team will contact you within a few hours.",
      });
    } catch (e) {
      toast.error("Could not submit request", {
        description: e instanceof Error ? e.message : "Please try again or reach us on WhatsApp.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" aria-hidden="true" />
        </div>
        <h3 className="mt-4 font-display text-xl font-bold text-zinc-900">
          Request received — thank you!
        </h3>
        <p className="mt-2 text-sm text-zinc-600">
          Your reference number is{" "}
          <span className="font-mono font-bold text-emerald-700">{done.reference}</span>. Our
          team will contact you within a few hours with a free quote and design mockup.
        </p>
        <p className="mt-2 text-sm text-zinc-600">
          Want a faster answer? Message us on WhatsApp — we usually reply within minutes.
        </p>
        <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href={whatsappUrl(
              `Hello Madni Advertiser! I just submitted a quote request (Ref: ${done.reference}) for ${form.service}. Here are the details: ${form.details.slice(0, 200)}`
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="w-full bg-emerald-500 font-bold text-white hover:bg-emerald-600 sm:w-auto">
              <WhatsAppIcon className="mr-2 h-4 w-4" /> Continue on WhatsApp
            </Button>
          </a>
          <Button
            variant="outline"
            className="w-full font-bold sm:w-auto"
            onClick={() => {
              setDone(null);
              setImage(null);
              setForm((f) => ({ ...f, details: productName ? `Project: ${productName}\n\n` : "" }));
            }}
          >
            Submit Another Request
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={compact ? "" : "rounded-xl border bg-white p-5 shadow-sm sm:p-7"}>
      {title && (
        <div className="mb-5">
          <h3 className="font-display text-xl font-bold text-zinc-900">{title}</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Tell us about your project — we reply with a free quote & mockup within hours.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="qf-name">Your Name *</Label>
          <Input
            id="qf-name"
            value={form.name}
            onChange={(e) => set("name")(e.target.value)}
            placeholder="e.g. Ahmed Raza"
            autoComplete="name"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="qf-phone">Phone / WhatsApp *</Label>
          <Input
            id="qf-phone"
            value={form.phone}
            onChange={(e) => set("phone")(e.target.value)}
            placeholder="03xx xxxxxxx"
            inputMode="tel"
            autoComplete="tel"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="qf-email">Email (optional)</Label>
          <Input
            id="qf-email"
            type="email"
            value={form.email}
            onChange={(e) => set("email")(e.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="qf-service">Service Needed *</Label>
          <Select value={form.service} onValueChange={set("service")}>
            <SelectTrigger id="qf-service" className="w-full">
              <SelectValue placeholder="Select a service" />
            </SelectTrigger>
            <SelectContent>
              {SERVICE_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="qf-city">City</Label>
          <Select value={form.city} onValueChange={set("city")}>
            <SelectTrigger id="qf-city" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SITE.cities.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
              <SelectItem value="Other">Other (we ship nationwide)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="qf-details">Project Details *</Label>
          <Textarea
            id="qf-details"
            value={form.details}
            onChange={(e) => set("details")(e.target.value)}
            placeholder="Describe your sign — size, text, location, budget, deadline…"
            rows={4}
          />
        </div>

        {/* Reference image upload */}
        <div className="sm:col-span-2">
          <Label>Reference Image (optional)</Label>
          {image ? (
            <div className="mt-2 flex items-center gap-3 rounded-lg border bg-zinc-50 p-3">
              { }
              <img src={image} alt="Reference upload preview" className="h-16 w-16 rounded-md object-cover" />
              <p className="flex-1 truncate text-sm text-zinc-600">Reference image attached</p>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => setImage(null)}
                aria-label="Remove reference image"
              >
                <Trash2 className="h-4 w-4 text-red-500" aria-hidden="true" />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-300 bg-zinc-50/60 px-4 py-4 text-sm font-medium text-zinc-500 transition-colors hover:border-primary/50 hover:text-primary"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <ImagePlus className="h-4 w-4" aria-hidden="true" />
              )}
              {uploading ? "Uploading…" : "Upload a photo, sketch or logo (max 5MB)"}
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button size="lg" className="font-bold sm:flex-1" onClick={submit} disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {submitting ? "Sending…" : "Request Free Quote"}
        </Button>
        <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="sm:flex-1">
          <Button
            size="lg"
            variant="outline"
            className="w-full border-emerald-500 font-bold text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700"
          >
            <WhatsAppIcon className="mr-2 h-4 w-4" /> WhatsApp Instead
          </Button>
        </a>
      </div>
      <p className="mt-3 text-center text-xs text-zinc-400">
        No obligation. Free design mockup with every quote.
      </p>
    </div>
  );
}
