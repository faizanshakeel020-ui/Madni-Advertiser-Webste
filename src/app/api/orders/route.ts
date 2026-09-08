import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateOrderNumber } from "@/lib/admin-auth";

type OrderItemPayload = {
  id: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  qty: number;
  selections?: { label: string; value: string }[];
};

/** POST /api/orders — guest checkout for Buy Now items */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName,
      phone,
      email,
      address,
      city,
      paymentMethod,
      notes,
      items,
    } = body as {
      customerName?: string;
      phone?: string;
      email?: string;
      address?: string;
      city?: string;
      paymentMethod?: string;
      notes?: string;
      items?: OrderItemPayload[];
    };

    // validation
    if (!customerName || customerName.trim().length < 2) {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
    }
    if (!phone || !/^[+]?[0-9\s-]{10,15}$/.test(phone.trim())) {
      return NextResponse.json({ error: "A valid phone number is required" }, { status: 400 });
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    if (!address || address.trim().length < 8) {
      return NextResponse.json({ error: "Delivery address is required" }, { status: 400 });
    }
    if (!city || !city.trim()) {
      return NextResponse.json({ error: "City is required" }, { status: 400 });
    }
    if (paymentMethod !== "COD" && paymentMethod !== "BANK_TRANSFER") {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }
    for (const item of items) {
      if (!item.id || !item.slug || !item.name || typeof item.price !== "number" || typeof item.qty !== "number" || item.qty < 1) {
        return NextResponse.json({ error: "Invalid cart item" }, { status: 400 });
      }
      if (item.qty > 99) item.qty = 99;
    }

    // verify items exist, are purchasable (BUY_NOW or BOTH), and compute subtotal server-side
    const ids = items.map((i) => i.id);
    const dbProducts = await db.product.findMany({ where: { id: { in: ids } } });
    const priceMap = new Map(dbProducts.map((p) => [p.id, p]));
    let subtotal = 0;
    const validatedItems: OrderItemPayload[] = [];
    for (const item of items) {
      const p = priceMap.get(item.id);
      if (!p || (p.type !== "BUY_NOW" && p.type !== "BOTH")) {
        return NextResponse.json(
          { error: `"${item.name}" is not available for direct purchase` },
          { status: 400 }
        );
      }
      const qty = Math.min(item.qty, Math.max(1, p.stock));
      subtotal += (p.price ?? 0) * qty;
      validatedItems.push({
        ...item,
        name: p.name,
        price: p.price ?? 0,
        image: item.image || (JSON.parse(p.images || "[]")[0] ?? ""),
        qty,
      });
    }

    // ensure unique order number
    let orderNumber = generateOrderNumber();
    for (let i = 0; i < 5; i++) {
      const existing = await db.order.findUnique({ where: { orderNumber } });
      if (!existing) break;
      orderNumber = generateOrderNumber();
    }

    const order = await db.order.create({
      data: {
        orderNumber,
        customerName: customerName.trim(),
        phone: phone.trim(),
        email: email?.trim() || null,
        address: address.trim(),
        city: city.trim(),
        items: JSON.stringify(validatedItems),
        subtotal,
        paymentMethod,
        status: "PENDING",
        notes: notes?.trim() || null,
      },
    });

    // decrement stock (best-effort)
    for (const item of validatedItems) {
      db.product
        .update({
          where: { id: item.id },
          data: { stock: { decrement: item.qty }, popularity: { increment: item.qty } },
        })
        .catch(() => {});
    }

    return NextResponse.json({ orderNumber: order.orderNumber }, { status: 201 });
  } catch (e) {
    console.error("orders POST error", e);
    return NextResponse.json({ error: "Could not place order" }, { status: 500 });
  }
}
