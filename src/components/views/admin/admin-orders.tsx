"use client";

/**
 * Admin — Orders management (view Buy Now orders, update status).
 */
import { useState } from "react";
import { Banknote, Landmark, Package, Phone, ReceiptText, Trash2, User } from "lucide-react";
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
import { adminDeleteOrder, adminUpdateOrderStatus } from "@/lib/api";
import { formatDateTime, formatPKR } from "@/lib/format";
import { ORDER_STATUSES } from "@/lib/constants";
import type { Order, OrderStatus } from "@/lib/types";

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  CONFIRMED: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  SHIPPED: "bg-violet-100 text-violet-800 hover:bg-violet-100",
  DELIVERED: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  CANCELLED: "bg-red-100 text-red-800 hover:bg-red-100",
};

export function AdminOrders({ orders, refresh }: { orders: Order[]; refresh: () => void }) {
  const [detail, setDetail] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(true);
    try {
      await adminUpdateOrderStatus(id, status);
      toast.success(`Order marked ${status.toLowerCase()}`);
      refresh();
      setDetail((d) => (d && d.id === id ? { ...d, status: status as OrderStatus } : d));
    } catch {
      toast.error("Status update failed");
    } finally {
      setUpdating(false);
    }
  };

  const deleteOrder = async (order: Order) => {
    if (!window.confirm(`Delete order ${order.orderNumber}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await adminDeleteOrder(order.id);
      toast.success("Order deleted");
      setDetail(null);
      refresh();
    } catch {
      toast.error("Order deletion failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-zinc-900">Orders</h1>
        <p className="mt-1 text-sm text-zinc-500">Buy Now orders — {orders.length} total</p>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b bg-zinc-50 text-left text-xs uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3 font-bold">Order</th>
                <th className="px-4 py-3 font-bold">Customer</th>
                <th className="px-4 py-3 font-bold">Items</th>
                <th className="px-4 py-3 font-bold">Total</th>
                <th className="px-4 py-3 font-bold">Payment</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 text-right font-bold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-zinc-50/60">
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs font-bold text-primary">{o.orderNumber}</p>
                    <p className="text-xs text-zinc-400">{formatDateTime(o.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-zinc-800">{o.customerName}</p>
                    <p className="text-xs text-zinc-500">{o.phone}</p>
                    <p className="text-xs text-zinc-400">{o.city}</p>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {o.items.reduce((n, i) => n + i.qty, 0)} item{o.items.reduce((n, i) => n + i.qty, 0) === 1 ? "" : "s"}
                  </td>
                  <td className="px-4 py-3 font-bold text-zinc-800">{formatPKR(o.subtotal)}</td>
                  <td className="px-4 py-3">
                    {o.paymentMethod === "COD" ? (
                      <span className="flex items-center gap-1.5 text-zinc-600"><Banknote className="h-3.5 w-3.5" aria-hidden="true" /> COD</span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-zinc-600"><Landmark className="h-3.5 w-3.5" aria-hidden="true" /> Bank</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v)} disabled={updating}>
                      <SelectTrigger className={`h-8 w-[130px] text-xs font-bold ${STATUS_STYLE[o.status] ?? ""}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className={`text-xs font-semibold ${STATUS_STYLE[s] ?? ""}`}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2"><Button variant="outline" size="sm" className="font-bold" onClick={() => setDetail(o)}>View</Button><Button variant="outline" size="icon" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => deleteOrder(o)} disabled={deleting} aria-label={`Delete order ${o.orderNumber}`}><Trash2 className="h-4 w-4" aria-hidden="true" /></Button></div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-zinc-400">
                    No orders yet — they&apos;ll appear here when customers check out.
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
                  Order <span className="font-mono text-primary">{detail.orderNumber}</span>
                  <Badge className={STATUS_STYLE[detail.status] ?? ""}>{detail.status}</Badge>
                </DialogTitle>
                <DialogDescription>Placed {formatDateTime(detail.createdAt)}</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border p-4">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-zinc-900"><User className="h-4 w-4 text-primary" aria-hidden="true" /> Customer</h4>
                  <dl className="mt-2 space-y-1 text-sm text-zinc-600">
                    <div className="flex justify-between gap-3"><dt>Name</dt><dd className="font-semibold text-zinc-800">{detail.customerName}</dd></div>
                    <div className="flex justify-between gap-3"><dt>Phone</dt><dd><a href={`tel:${detail.phone}`} className="flex items-center gap-1 font-semibold text-primary"><Phone className="h-3 w-3" aria-hidden="true" /> {detail.phone}</a></dd></div>
                    {detail.email && <div className="flex justify-between gap-3"><dt>Email</dt><dd className="text-right">{detail.email}</dd></div>}
                    <div className="flex justify-between gap-3"><dt>City</dt><dd className="font-semibold text-zinc-800">{detail.city}</dd></div>
                    <div><dt>Address</dt><dd className="mt-0.5 text-zinc-600">{detail.address}</dd></div>
                  </dl>
                </div>
                <div className="rounded-xl border p-4">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-zinc-900"><ReceiptText className="h-4 w-4 text-primary" aria-hidden="true" /> Payment</h4>
                  <dl className="mt-2 space-y-1 text-sm text-zinc-600">
                    <div className="flex justify-between gap-3"><dt>Method</dt><dd className="font-semibold text-zinc-800">{detail.paymentMethod === "COD" ? "Cash on Delivery" : "Bank Transfer"}</dd></div>
                    <div className="flex justify-between gap-3"><dt>Subtotal</dt><dd className="font-bold text-zinc-900">{formatPKR(detail.subtotal)}</dd></div>
                  </dl>
                  <div className="mt-3">
                    <Select value={detail.status} onValueChange={(v) => updateStatus(detail.id, v)} disabled={updating}>
                      <SelectTrigger className={`h-9 text-xs font-bold ${STATUS_STYLE[detail.status] ?? ""}`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className={`text-xs font-semibold ${STATUS_STYLE[s] ?? ""}`}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border">
                <h4 className="flex items-center gap-2 border-b px-4 py-3 text-sm font-bold text-zinc-900">
                  <Package className="h-4 w-4 text-primary" aria-hidden="true" /> Items ({detail.items.length})
                </h4>
                <ul className="divide-y">
                  {detail.items.map((i, idx) => (
                    <li key={idx} className="flex items-center gap-4 px-4 py-3">
                      { }
                      <img src={i.image} alt={i.name} className="h-12 w-12 rounded-lg border object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-zinc-800">{i.name}</p>
                        {i.selections && i.selections.length > 0 && (
                          <p className="text-xs text-zinc-500">{i.selections.map((s) => `${s.label}: ${s.value}`).join(" · ")}</p>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500">×{i.qty}</p>
                      <p className="text-sm font-bold text-zinc-900">{formatPKR(i.price * i.qty)}</p>
                    </li>
                  ))}
                </ul>
              </div>

              {detail.notes && (
                <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-bold">Customer notes</p>
                  <p className="mt-1">{detail.notes}</p>
                </div>
              )}
              <div className="flex justify-end border-t pt-4"><Button type="button" variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => deleteOrder(detail)} disabled={deleting}><Trash2 className="h-4 w-4" aria-hidden="true" /> Delete order</Button></div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
