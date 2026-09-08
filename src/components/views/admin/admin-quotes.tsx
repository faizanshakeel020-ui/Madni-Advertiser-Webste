"use client";

/**
 * Admin — Quote Requests management (view custom/service quotes, update status).
 */
import { useState } from "react";
import { ClipboardList, ExternalLink, Mail, MapPin, Phone, User } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminUpdateQuoteStatus } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { QUOTE_STATUSES } from "@/lib/constants";
import type { QuoteRequest, QuoteStatus } from "@/lib/types";

const STATUS_STYLE: Record<string, string> = {
  NEW: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  CONTACTED: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  QUOTED: "bg-violet-100 text-violet-800 hover:bg-violet-100",
  CLOSED: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
};

export function AdminQuotes({ quotes, refresh }: { quotes: QuoteRequest[]; refresh: () => void }) {
  const [detail, setDetail] = useState<QuoteRequest | null>(null);
  const [updating, setUpdating] = useState(false);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(true);
    try {
      await adminUpdateQuoteStatus(id, status);
      toast.success(`Quote marked ${status.toLowerCase()}`);
      refresh();
      setDetail((d) => (d && d.id === id ? { ...d, status: status as QuoteStatus } : d));
    } catch {
      toast.error("Status update failed");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-zinc-900">Quote Requests</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Custom orders & service inquiries — {quotes.length} total (
          {quotes.filter((q) => q.status === "NEW").length} new)
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b bg-zinc-50 text-left text-xs uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3 font-bold">Reference</th>
                <th className="px-4 py-3 font-bold">Customer</th>
                <th className="px-4 py-3 font-bold">Service</th>
                <th className="px-4 py-3 font-bold">City</th>
                <th className="px-4 py-3 font-bold">Image</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 text-right font-bold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {quotes.map((q) => (
                <tr key={q.id} className="hover:bg-zinc-50/60">
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs font-bold text-primary">{q.reference}</p>
                    <p className="text-xs text-zinc-400">{formatDateTime(q.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-zinc-800">{q.name}</p>
                    <p className="text-xs text-zinc-500">{q.phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-zinc-700">{q.service}</p>
                    {q.productName && <p className="text-xs text-zinc-400">{q.productName}</p>}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{q.city}</td>
                  <td className="px-4 py-3">
                    {q.referenceImage ? (
                      <a href={q.referenceImage} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> View
                      </a>
                    ) : (
                      <span className="text-xs text-zinc-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Select value={q.status} onValueChange={(v) => updateStatus(q.id, v)} disabled={updating}>
                      <SelectTrigger className="h-8 w-[130px] text-xs font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {QUOTE_STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="outline" size="sm" className="font-bold" onClick={() => setDetail(q)}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
              {quotes.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-zinc-400">
                    No quote requests yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-h-[90vh] sm:max-w-3xl overflow-y-auto scrollbar-thin">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2">
                  Quote <span className="font-mono text-primary">{detail.reference}</span>
                  <Badge className={STATUS_STYLE[detail.status] ?? ""}>{detail.status}</Badge>
                </DialogTitle>
                <DialogDescription>Submitted {formatDateTime(detail.createdAt)}</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border p-4">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-zinc-900"><User className="h-4 w-4 text-primary" aria-hidden="true" /> Customer</h4>
                  <dl className="mt-2 space-y-1 text-sm text-zinc-600">
                    <div className="flex justify-between gap-3"><dt>Name</dt><dd className="font-semibold text-zinc-800">{detail.name}</dd></div>
                    <div className="flex justify-between gap-3">
                      <dt>Phone</dt>
                      <dd>
                        <a href={`https://wa.me/${detail.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-semibold text-emerald-600 hover:underline">
                          <Phone className="h-3 w-3" aria-hidden="true" /> {detail.phone}
                        </a>
                      </dd>
                    </div>
                    {detail.email && (
                      <div className="flex justify-between gap-3">
                        <dt>Email</dt>
                        <dd>
                          <a href={`mailto:${detail.email}`} className="flex items-center gap-1 font-semibold text-primary hover:underline">
                            <Mail className="h-3 w-3" aria-hidden="true" /> {detail.email}
                          </a>
                        </dd>
                      </div>
                    )}
                    <div className="flex justify-between gap-3"><dt>City</dt><dd className="flex items-center gap-1 font-semibold text-zinc-800"><MapPin className="h-3 w-3" aria-hidden="true" /> {detail.city}</dd></div>
                  </dl>
                </div>
                <div className="rounded-xl border p-4">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-zinc-900"><ClipboardList className="h-4 w-4 text-primary" aria-hidden="true" /> Request</h4>
                  <dl className="mt-2 space-y-1 text-sm text-zinc-600">
                    <div className="flex justify-between gap-3"><dt>Service</dt><dd className="font-semibold text-zinc-800">{detail.service}</dd></div>
                    {detail.productName && <div className="flex justify-between gap-3"><dt>Product</dt><dd className="text-right">{detail.productName}</dd></div>}
                  </dl>
                  <div className="mt-3">
                    <Select value={detail.status} onValueChange={(v) => updateStatus(detail.id, v)} disabled={updating}>
                      <SelectTrigger className="h-9 text-xs font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {QUOTE_STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border p-4">
                <h4 className="text-sm font-bold text-zinc-900">Project Details</h4>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600">{detail.details}</p>
              </div>

              {detail.referenceImage && (
                <div className="overflow-hidden rounded-xl border">
                  <a href={detail.referenceImage} target="_blank" rel="noopener noreferrer">
                    { }
                    <img src={detail.referenceImage} alt="Customer reference image" className="max-h-96 w-full object-contain bg-zinc-50" />
                  </a>
                  <p className="border-t bg-zinc-50 px-4 py-2 text-center text-xs text-zinc-500">
                    Customer reference image — click to open full size
                  </p>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
