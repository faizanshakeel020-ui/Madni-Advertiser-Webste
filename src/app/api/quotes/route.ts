import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateQuoteRef } from "@/lib/admin-auth";

/** POST /api/quotes — custom/service quote requests (guest) */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, service, productName, details, city, referenceImage } = body as {
      name?: string;
      phone?: string;
      email?: string;
      service?: string;
      productName?: string;
      details?: string;
      city?: string;
      referenceImage?: string;
    };

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: "Your name is required" }, { status: 400 });
    }
    if (!phone || !/^[+]?[0-9\s-]{10,15}$/.test(phone.trim())) {
      return NextResponse.json({ error: "A valid phone number is required" }, { status: 400 });
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    if (!service || !service.trim()) {
      return NextResponse.json({ error: "Please select a service" }, { status: 400 });
    }
    if (!details || details.trim().length < 10) {
      return NextResponse.json({ error: "Please describe your project" }, { status: 400 });
    }
    if (referenceImage && !/^\/api\/files\/[a-zA-Z0-9_-]+\.[a-z]+$/.test(referenceImage)) {
      return NextResponse.json({ error: "Invalid reference image" }, { status: 400 });
    }

    let reference = generateQuoteRef();
    for (let i = 0; i < 5; i++) {
      const existing = await db.quoteRequest.findUnique({ where: { reference } });
      if (!existing) break;
      reference = generateQuoteRef();
    }

    const quote = await db.quoteRequest.create({
      data: {
        reference,
        name: name.trim(),
        phone: phone.trim(),
        email: email?.trim() || null,
        service: service.trim(),
        productName: productName?.trim() || null,
        details: details.trim(),
        city: city?.trim() || "—",
        referenceImage: referenceImage || null,
        status: "NEW",
      },
    });

    return NextResponse.json({ reference: quote.reference }, { status: 201 });
  } catch (e) {
    console.error("quotes POST error", e);
    return NextResponse.json({ error: "Could not submit request" }, { status: 500 });
  }
}
