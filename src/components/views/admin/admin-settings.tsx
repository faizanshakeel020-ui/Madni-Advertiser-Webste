"use client";

import { useEffect, useState } from "react";
import { Bell, Globe, KeyRound, Loader2, Plus, Save, Share2, ShoppingBag, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminGetSettings, adminUpdateSettings } from "@/lib/api";

const defaults = {
  business: { phone: "+92 300 4572300", email: "madniad786@gmail.com", address: "Imtiaz Center, Main Market, Gulberg II, Lahore, Pakistan", hours: "Mon - Sat: 10:00 AM - 9:00 PM" },
  social: { links: [{ platform: "Facebook", url: "https://www.facebook.com/share/19BFHfpMDt/" }, { platform: "Instagram", url: "https://www.instagram.com/madniadvertiser1999/" }] },
  quote: { enabled: true, responseMessage: "Our team will contact you within a few hours." },
  orders: { codEnabled: true, bankTransferEnabled: true, deliveryCharge: 0, minimumOrder: 0 },
  homepage: { heroTitle: "Signs That Make Your Business Shine", promotion: "" },
  notifications: { email: "madniad786@gmail.com", whatsapp: true, newOrders: true, newQuotes: true },
  seo: { title: "Madni Advertiser - Signage & Display Advertising", description: "Custom signage, LED displays and advertising solutions across Pakistan." },
};

type Settings = typeof defaults;
type SectionProps = { title: string; icon: React.ElementType; children: React.ReactNode; onSave?: () => void; saving?: boolean };

function Section({ title, icon: Icon, children, onSave, saving }: SectionProps) {
  return <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6"><div className="mb-5 flex items-center justify-between gap-3 border-b pb-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-primary"><Icon className="h-4 w-4" aria-hidden="true" /></span><h2 className="font-display text-lg font-bold text-zinc-900">{title}</h2></div>{onSave && <Button type="button" size="sm" onClick={onSave} disabled={saving} className="border-primary bg-primary text-primary-foreground hover:bg-primary/90">Save section</Button>}</div>{children}</section>;
}

export function AdminSettings({ onUpdated }: { onUpdated: () => void }) {
  const [settings, setSettings] = useState<Settings>(defaults);
  const [username, setUsername] = useState("");
  const [savedUsername, setSavedUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminGetSettings().then((data) => {
      setUsername(data.username);
      setSavedUsername(data.username);
      const storedSocial = data.settings.social as { links?: { platform: string; url: string }[]; facebook?: string; instagram?: string } | undefined;
      const links = storedSocial?.links ?? [
        ...(storedSocial?.facebook ? [{ platform: "Facebook", url: storedSocial.facebook }] : []),
        ...(storedSocial?.instagram ? [{ platform: "Instagram", url: storedSocial.instagram }] : []),
      ];
      setSettings({ ...defaults, ...data.settings, social: { links } } as Settings);
    }).catch(() => toast.error("Could not load settings")).finally(() => setLoading(false));
  }, []);

  const update = <SectionName extends keyof Settings>(section: SectionName, key: keyof Settings[SectionName], value: string | boolean | number) => {
    setSettings((current) => ({ ...current, [section]: { ...current[section], [key]: value } }));
  };

  const updateSocialLink = (index: number, key: "platform" | "url", value: string) => {
    setSettings((current) => ({
      ...current,
      social: { links: current.social.links.map((link, linkIndex) => linkIndex === index ? { ...link, [key]: value } : link) },
    }));
  };

  const addSocialLink = () => {
    setSettings((current) => ({ ...current, social: { links: [...current.social.links, { platform: "New platform", url: "" }] } }));
  };

  const removeSocialLink = (index: number) => {
    setSettings((current) => ({ ...current, social: { links: current.social.links.filter((_, linkIndex) => linkIndex !== index) } }));
  };


  const saveSettings = async (settingsToSave: Partial<Settings>, credentials = false) => {
    if (credentials && !currentPassword) { toast.error("Enter your current password to change admin credentials"); return; }
    if (credentials && newPassword && newPassword.length < 8) { toast.error("New password must be at least 8 characters"); return; }
    if (credentials && newPassword !== confirmPassword) { toast.error("New passwords do not match"); return; }
    setSaving(true);
    try {
      await adminUpdateSettings({ ...(credentials ? { currentPassword, username, ...(newPassword ? { password: newPassword } : {}) } : {}), settings: settingsToSave });
      toast.success(credentials ? "Settings saved. Please sign in again." : "Section settings saved.");
      if (credentials) onUpdated();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save settings"); }
    finally { setSaving(false); }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    await saveSettings(settings, username !== savedUsername || Boolean(newPassword));
  };

  const saveSection = async <SectionName extends keyof Settings>(section: SectionName) => {
    await saveSettings({ [section]: settings[section] } as Partial<Settings>);
  };

  if (loading) return <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" aria-label="Loading settings" /></div>;

  return <form onSubmit={submit} className="max-w-4xl space-y-6">
    <div><h1 className="font-display text-2xl font-bold text-zinc-900">Settings</h1><p className="mt-1 text-sm text-zinc-500">Control your business information, sales options, notifications and search appearance.</p></div>

    <Section title="Business information" icon={UserRound} onSave={() => saveSection("business")} saving={saving}><div className="grid gap-4 sm:grid-cols-2"><Field label="Phone" value={settings.business.phone} onChange={(value) => update("business", "phone", value)} /><Field label="Email" value={settings.business.email} onChange={(value) => update("business", "email", value)} /><Field label="Address" value={settings.business.address} onChange={(value) => update("business", "address", value)} /><Field label="Opening hours" value={settings.business.hours} onChange={(value) => update("business", "hours", value)} /></div></Section>

    <Section title="Social media" icon={Share2} onSave={() => saveSection("social")} saving={saving}><div className="space-y-3">{settings.social.links.map((link, index) => <div key={index} className="flex items-end gap-2"><Field id={`social-platform-${index}`} label="Platform name" value={link.platform} onChange={(value) => updateSocialLink(index, "platform", value)} /><Field id={`social-url-${index}`} label="Profile URL" value={link.url} onChange={(value) => updateSocialLink(index, "url", value)} /><Button type="button" variant="outline" size="icon" onClick={() => removeSocialLink(index)} aria-label={`Remove ${link.platform} link`}><Trash2 className="h-4 w-4" aria-hidden="true" /></Button></div>)}<Button type="button" variant="outline" size="sm" onClick={addSocialLink}><Plus className="h-4 w-4" aria-hidden="true" /> Add social link</Button></div></Section>

      <Section title="Quotes and orders" icon={ShoppingBag} onSave={() => saveSettings({ quote: settings.quote, orders: settings.orders })} saving={saving}><div className="grid gap-4 sm:grid-cols-2"><Toggle label="Accept quote requests" checked={settings.quote.enabled} onChange={(value) => update("quote", "enabled", value)} /><Toggle label="Cash on Delivery" checked={settings.orders.codEnabled} onChange={(value) => update("orders", "codEnabled", value)} /><Toggle label="Bank transfer" checked={settings.orders.bankTransferEnabled} onChange={(value) => update("orders", "bankTransferEnabled", value)} /><Field label="Delivery charge (PKR)" type="number" value={String(settings.orders.deliveryCharge)} onChange={(value) => update("orders", "deliveryCharge", Number(value) || 0)} /><Field label="Minimum order (PKR)" type="number" value={String(settings.orders.minimumOrder)} onChange={(value) => update("orders", "minimumOrder", value)} /><Field label="Quote response message" value={settings.quote.responseMessage} onChange={(value) => update("quote", "responseMessage", value)} /></div></Section>

      <Section title="Homepage and SEO" icon={Globe} onSave={() => saveSettings({ homepage: settings.homepage, seo: settings.seo })} saving={saving}><div className="space-y-4"><Field label="Homepage headline" value={settings.homepage.heroTitle} onChange={(value) => update("homepage", "heroTitle", value)} /><Field label="Promotion banner text" value={settings.homepage.promotion} onChange={(value) => update("homepage", "promotion", value)} /><Field label="Search title" value={settings.seo.title} onChange={(value) => update("seo", "title", value)} /><Field label="Search description" value={settings.seo.description} onChange={(value) => update("seo", "description", value)} /></div></Section>

    <Section title="Notifications" icon={Bell} onSave={() => saveSection("notifications")} saving={saving}><div className="grid gap-4 sm:grid-cols-2"><Field label="Notification email" value={settings.notifications.email} onChange={(value) => update("notifications", "email", value)} /><Toggle label="WhatsApp notifications" checked={settings.notifications.whatsapp} onChange={(value) => update("notifications", "whatsapp", value)} /><Toggle label="New order alerts" checked={settings.notifications.newOrders} onChange={(value) => update("notifications", "newOrders", value)} /><Toggle label="New quote alerts" checked={settings.notifications.newQuotes} onChange={(value) => update("notifications", "newQuotes", value)} /></div></Section>


    <Section title="Admin credentials" icon={KeyRound}><div className="grid gap-4 sm:grid-cols-2"><Field label="Username" value={username} onChange={setUsername} /><Field label="Current password" type="password" value={currentPassword} onChange={setCurrentPassword} required /><Field label="New password" type="password" value={newPassword} onChange={setNewPassword} /><Field label="Confirm new password" type="password" value={confirmPassword} onChange={setConfirmPassword} /></div><p className="mt-4 text-xs text-zinc-500">Enter the current password to save any setting. Leave the new password fields blank to keep it unchanged.</p></Section>

    <div className="flex justify-end"><Button type="submit" disabled={saving} className="font-bold">{saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />} Save all settings</Button></div>
  </form>;
}

function Field({ id, label, value, onChange, type = "text", required = false }: { id?: string; label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  const fieldId = id ?? `settings-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return <div className="space-y-1.5"><Label htmlFor={fieldId}>{label}</Label><Input id={fieldId} type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} /></div>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex min-h-10 cursor-pointer items-center gap-3 rounded-lg border px-3 text-sm font-semibold text-zinc-700"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-[hsl(var(--primary))]" />{label}</label>;
}
