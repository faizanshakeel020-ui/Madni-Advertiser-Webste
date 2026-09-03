"use client";

import { useEffect, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Landmark,
  Lock,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useCart, cartSubtotal, itemKey } from "@/store/cart";
import { useRoute } from "@/lib/router";
import { formatPKR } from "@/lib/format";
import { createOrder, fetchOrder } from "@/lib/api";
import { SITE, PAYMENT_METHODS } from "@/lib/constants";

export function CheckoutView() {
  const { navigate } = useRoute();
  const { items, clear } = useCart();
  const subtotal = cartSubtotal(items);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    address: "",
    city: "Lahore",
    notes: "",
  });
  const [payment, setPayment] = useState<string>("COD");

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async () => {
    if (!form.customerName.trim() || form.customerName.trim().length < 2) {
      toast.error("Please enter your full name");
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
    if (form.address.trim().length < 8) {
      toast.error("Please enter your complete delivery address");
      return;
    }
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    setSubmitting(true);
    try {
      const res = await createOrder({
        customerName: form.customerName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        address: form.address.trim(),
        city: form.city,
        paymentMethod: payment,
        notes: form.notes.trim() || undefined,
        items: items.map((i) => ({
          id: i.id,
          slug: i.slug,
          name: i.name,
          image: i.image,
          price: i.price,
          qty: i.qty,
          selections: i.selections,
        })),
      });
      clear();
      toast.success("Order placed successfully!");
      navigate(`/order/${res.orderNumber}`);
    } catch (e) {
      toast.error("Could not place order", {
        description: e instanceof Error ? e.message : "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container-site flex flex-col items-center py-20 text-center">
        <ShoppingBag className="h-12 w-12 text-zinc-300" aria-hidden="true" />
        <h1 className="mt-4 font-display text-2xl font-bold text-zinc-900">Nothing to checkout</h1>
        <p className="mt-2 text-sm text-zinc-500">Add some products to your cart first.</p>
        <Button className="mt-6 rounded-full font-bold" onClick={() => navigate("/shop")}>
          Go to Shop
        </Button>
      </div>
    );
  }

  return (
    <div className="container-site py-8 lg:py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-zinc-500" aria-label="Breadcrumb">
        <button onClick={() => navigate("/cart")} className="hover:text-primary">Cart</button>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="font-semibold text-zinc-900">Checkout</span>
      </nav>

      <h1 className="font-display text-2xl font-bold text-zinc-900 sm:text-3xl">Checkout</h1>
      <p className="mt-1.5 flex items-center gap-1.5 text-sm text-zinc-500">
        <Lock className="h-3.5 w-3.5" aria-hidden="true" />
        No account needed — guest checkout, delivered across Pakistan.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border bg-white p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold text-zinc-900">Delivery Details</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="co-name">Full Name *</Label>
                <Input id="co-name" value={form.customerName} onChange={set("customerName")} placeholder="e.g. Ahmed Raza" autoComplete="name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="co-phone">Phone / WhatsApp *</Label>
                <Input id="co-phone" value={form.phone} onChange={set("phone")} placeholder="03xx xxxxxxx" inputMode="tel" autoComplete="tel" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="co-email">Email (optional)</Label>
                <Input id="co-email" type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" autoComplete="email" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="co-city">City *</Label>
                <select
                  id="co-city"
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50"
                >
                  {SITE.cities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="Other">Other (we deliver nationwide)</option>
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="co-address">Complete Address *</Label>
                <Input id="co-address" value={form.address} onChange={set("address")} placeholder="House / Shop no, street, area…" autoComplete="street-address" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="co-notes">Order Notes (optional)</Label>
                <Textarea id="co-notes" rows={3} value={form.notes} onChange={set("notes")} placeholder="Text for your sign, delivery timing, landmark…" />
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="rounded-2xl border bg-white p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold text-zinc-900">Payment Method</h2>
            <RadioGroup value={payment} onValueChange={setPayment} className="mt-5 grid gap-3">
              {PAYMENT_METHODS.map((m) => (
                <Label
                  key={m.value}
                  htmlFor={`pay-${m.value}`}
                  className={`flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 transition-colors ${
                    payment === m.value ? "border-primary bg-accent/50" : "hover:border-zinc-400"
                  }`}
                >
                  <RadioGroupItem value={m.value} id={`pay-${m.value}`} className="mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-bold text-zinc-900">
                      {m.value === "COD" ? (
                        <Banknote className="h-4.5 w-4.5 text-primary" aria-hidden="true" />
                      ) : (
                        <Landmark className="h-4.5 w-4.5 text-primary" aria-hidden="true" />
                      )}
                      {m.label}
                    </div>
                    <p className="mt-0.5 text-sm text-zinc-500">{m.description}</p>
                    {m.value === "BANK_TRANSFER" && payment === "BANK_TRANSFER" && (
                      <div className="mt-3 rounded-lg bg-zinc-50 p-3.5 text-sm">
                        <p className="font-bold text-zinc-800">{SITE.bank.name}</p>
                        <p className="mt-1 text-zinc-600">Account Title: {SITE.bank.accountTitle}</p>
                        <p className="text-zinc-600">Account No: {SITE.bank.accountNumber}</p>
                        <p className="mt-1 text-xs text-zinc-500">Share the receipt on WhatsApp after placing the order.</p>
                      </div>
                    )}
                  </div>
                </Label>
              ))}
            </RadioGroup>
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
              <ShieldCheck className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
              Every order is confirmed by our team via WhatsApp or call before dispatch.
            </div>
          </div>
        </div>

        {/* Summary */}
        <aside className="lg:col-span-1">
          <div className="sticky top-32 rounded-2xl border bg-zinc-50 p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold text-zinc-900">Your Order</h2>
            <ul className="mt-4 space-y-3 max-h-64 overflow-y-auto scrollbar-thin pr-1">
              {items.map((i) => (
                <li key={itemKey(i)} className="flex gap-3">
                  { }
                  <img src={i.image} alt={i.name} className="h-14 w-14 shrink-0 rounded-lg border bg-white object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-bold text-zinc-800">{i.name}</p>
                    <p className="text-xs text-zinc-500">
                      {i.qty} × {formatPKR(i.price)}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-zinc-900">{formatPKR(i.price * i.qty)}</p>
                </li>
              ))}
            </ul>
            <Separator className="my-4" />
            <div className="flex items-baseline justify-between">
              <span className="font-display text-base font-bold text-zinc-900">Subtotal</span>
              <span className="font-display text-2xl font-bold text-zinc-900">{formatPKR(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">Delivery charges confirmed on call — no hidden prices.</p>
            <Button size="lg" className="mt-5 w-full rounded-xl font-bold" onClick={submit} disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              )}
              {submitting ? "Placing Order…" : `Place Order — ${formatPKR(subtotal)}`}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ---------- Order confirmation (#/order/:orderNumber) ---------- */
export function OrderConfirmationView({ orderNumber }: { orderNumber: string }) {
  const { navigate } = useRoute();
  const [order, setOrder] = useState<{
    orderNumber: string;
    customerName: string;
    phone: string;
    city: string;
    address: string;
    subtotal: number;
    paymentMethod: string;
    status: string;
    items: { name: string; qty: number; price: number; image: string }[];
  } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchOrder(orderNumber)
      .then((o) => alive && setOrder(o))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [orderNumber]);

  if (error) {
    return (
      <div className="container-site flex flex-col items-center py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-zinc-900">Order not found</h1>
        <p className="mt-2 text-sm text-zinc-500">Check your order number or contact us on WhatsApp.</p>
        <Button className="mt-6 rounded-full font-bold" onClick={() => navigate("/shop")}>Back to Shop</Button>
      </div>
    );
  }

  return (
    <div className="bg-zinc-50">
      <div className="container-site max-w-3xl py-12 lg:py-16">
        <div className="rounded-2xl border bg-white p-6 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-9 w-9 text-emerald-600" aria-hidden="true" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-bold text-zinc-900 sm:text-3xl">
            Thank you{order ? `, ${order.customerName.split(" ")[0]}` : ""}! 🎉
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Your order has been placed successfully. Our team will confirm it via WhatsApp or a
            quick call within a few hours.
          </p>
          {order && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 text-sm">
              Order Number:
              <span className="font-mono font-bold text-primary">{order.orderNumber}</span>
            </p>
          )}

          {order && (
            <div className="mt-8 rounded-xl border text-left">
              <div className="border-b bg-zinc-50/70 px-5 py-3.5 flex flex-wrap justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-zinc-500">Deliver to</p>
                  <p className="text-sm font-bold text-zinc-800">{order.customerName} · {order.phone}</p>
                  <p className="text-sm text-zinc-600">{order.address}, {order.city}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-zinc-500">Payment</p>
                  <p className="text-sm font-bold text-zinc-800">
                    {order.paymentMethod === "COD" ? "Cash on Delivery" : "Bank Transfer"}
                  </p>
                  <p className="text-sm font-bold text-primary">{formatPKR(order.subtotal)}</p>
                </div>
              </div>
              <ul className="divide-y">
                {order.items.map((i, idx) => (
                  <li key={idx} className="flex items-center gap-4 px-5 py-3.5">
                    { }
                    <img src={i.image} alt={i.name} className="h-12 w-12 rounded-lg border object-cover" />
                    <p className="flex-1 text-sm font-medium text-zinc-800">{i.name}</p>
                    <p className="text-sm text-zinc-500">×{i.qty}</p>
                    <p className="text-sm font-bold text-zinc-900">{formatPKR(i.price * i.qty)}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {order?.paymentMethod === "BANK_TRANSFER" && (
            <div className="mt-6 rounded-xl bg-accent/60 p-5 text-left text-sm">
              <p className="font-display font-bold text-zinc-900">Bank Transfer Details</p>
              <p className="mt-2 text-zinc-700">{SITE.bank.name}</p>
              <p className="text-zinc-700">Account Title: <b>{SITE.bank.accountTitle}</b></p>
              <p className="text-zinc-700">Account No: <b className="font-mono">{SITE.bank.accountNumber}</b></p>
              <p className="mt-2 text-xs text-zinc-600">
                Please transfer the total and share the receipt on WhatsApp to speed up dispatch.
              </p>
            </div>
          )}

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
                `Hello Madni Advertiser! I just placed order ${orderNumber}. Please confirm it.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" className="w-full bg-emerald-500 font-bold text-white hover:bg-emerald-600 sm:w-auto">
                Confirm on WhatsApp
              </Button>
            </a>
            <Button size="lg" variant="outline" className="font-bold" onClick={() => navigate("/shop")}>
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
