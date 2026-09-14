"use client";

import { PhoneCall, Zap } from "lucide-react";
import { QuoteForm } from "@/components/site/quote-form";
import { useRoute } from "@/lib/router";
import { SITE } from "@/lib/constants";
import { useContent } from "@/lib/content";
import { WhatsAppIcon } from "@/components/site/icons";

export function QuoteView() {
  const { route } = useRoute();
  const { services: SERVICES } = useContent();
  const preselect = route.query.service ?? undefined;
  const product = route.query.product ?? undefined;

  return (
    <div className="bg-zinc-50">
      <div className="bg-zinc-950 py-12 lg:py-16">
        <div className="container-site">
          <p className="mb-2 font-display text-xs font-bold uppercase tracking-[0.2em] text-primary">Free Quote</p>
          <h1 className="font-display text-3xl font-bold text-white lg:text-4xl">
            Get a Free Quote
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-300 sm:text-base">
            Custom signs, bulk orders, full-building branding — tell us what you need and get
            pricing plus a free design mockup, usually within a few hours.
          </p>
          <div className="mt-5 flex flex-wrap gap-4 text-sm">
            <a href={SITE.phoneHref} className="flex items-center gap-2 font-bold text-white hover:text-primary">
              <PhoneCall className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="flex flex-col leading-tight">
                <span>{SITE.phone}</span>
                <span className="text-xs font-semibold text-primary">{SITE.phoneContactName}</span>
              </span>
            </a>
            <a
              href={`https://wa.me/${SITE.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 font-bold text-emerald-400 hover:text-emerald-300"
            >
              <WhatsAppIcon className="h-4 w-4" /> WhatsApp
            </a>
          </div>
        </div>
      </div>

      <div className="container-site grid gap-8 py-10 lg:grid-cols-3 lg:py-14">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-8">
            <QuoteForm
              defaultService={preselect}
              productName={product}
              title={product ? `Custom Quote — ${product}` : "Tell Us About Your Project"}
            />
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border bg-zinc-950 p-6 text-white">
            <Zap className="h-7 w-7 text-primary" aria-hidden="true" />
            <h3 className="mt-3 font-display text-lg font-bold">What you get</h3>
            <ul className="mt-3 space-y-2.5 text-sm text-zinc-300">
              <li>· Free 3D design mockup</li>
              <li>· Transparent itemized pricing</li>
              <li>· Fabrication timeline</li>
              <li>· Installation plan & quote</li>
              <li>· No obligation, no hidden charges</li>
            </ul>
          </div>

          <div className="rounded-2xl border bg-white p-6">
            <h3 className="font-display text-base font-bold text-zinc-900">Popular services</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {SERVICES.map((s) => (
                <li key={s.slug} className="flex items-center gap-2 text-zinc-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                  {s.name}
                </li>
              ))}
              <li className="flex items-center gap-2 text-zinc-600">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                Bulk & corporate orders
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <h3 className="font-display text-base font-bold text-zinc-900">In a hurry?</h3>
            <p className="mt-1.5 text-sm text-zinc-600">
              WhatsApp us photos of your shop or wall — we quote from photos all the time.
            </p>
            <a
              href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
                "Hello Madni Advertiser! I need a quote. Here are photos of my location…"
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-600"
            >
              <WhatsAppIcon className="h-4 w-4" /> Message on WhatsApp
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
