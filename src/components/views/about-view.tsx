"use client";

import {
  Award,
  CheckCircle2,
  Factory,
  HeartHandshake,
  Lightbulb,
  MapPin,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";
import { SectionHeading } from "@/components/site/section-heading";
import { Button } from "@/components/ui/button";
import { useRoute } from "@/lib/router";
import { SITE } from "@/lib/constants";
import { useContent } from "@/lib/content";

export function AboutView() {
  const { navigate } = useRoute();
  const { about } = useContent();

  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden bg-zinc-950 py-16 lg:py-24">
        { }
        <img
          src={about.images[0] ?? "/images/about-workshop.png"}
          alt="Madni Advertiser signage fabrication workshop"
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-zinc-950/30" aria-hidden="true" />
        <div className="container-site relative">
          <p className="mb-2 font-display text-xs font-bold uppercase tracking-[0.2em] text-primary">About Us</p>
          <h1 className="max-w-2xl font-display text-3xl font-bold leading-tight text-white lg:text-5xl">
            {about.heroTitle}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-base">
            {about.heroText}
          </p>
        </div>
      </div>

      {/* Story */}
      <section className="py-14 lg:py-20">
        <div className="container-site grid items-center gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Our Story"
              title={about.storyTitle}
              align="left"
            />
            <div className="space-y-4 text-sm leading-relaxed text-zinc-600 sm:text-base">
              <p>
                {about.storyText}
              </p>
              <p>
                We&apos;ve completed <b className="text-zinc-900">{SITE.stats.projects}+ projects</b> across{" "}
                <b className="text-zinc-900">{SITE.stats.cities} cities</b> — for restaurants and retail
                shops, hospitals and hotels, schools, malls and families decorating their homes.
                Big client or small, every project gets the same free design mockup, the same
                premium materials and the same installation crew that treats your wall like their own.
              </p>
              <p>
                <b className="text-zinc-900">{about.mission}</b>
              </p>
            </div>
          </div>
          <div className="grid gap-4">
            {about.images.map((image, index) => (
              <img
                key={`${image}-${index}`}
                src={image}
                alt={`Madni Advertiser About Us image ${index + 1}`}
                className="aspect-[16/10] w-full rounded-2xl object-cover shadow-md"
                loading="lazy"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-zinc-950 py-12" aria-label="Company statistics">
        <div className="container-site grid grid-cols-2 gap-6 text-center sm:grid-cols-4">
          {[
            { value: `${SITE.stats.years}+`, label: "Years of Experience" },
            { value: `${SITE.stats.projects}+`, label: "Projects Delivered" },
            { value: `${SITE.stats.cities}`, label: "Cities Served" },
            { value: `${SITE.stats.clients}+`, label: "Happy Clients" },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-display text-3xl font-bold text-primary sm:text-4xl">{s.value}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-zinc-400 sm:text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why choose us */}
      <section className="py-14 lg:py-20">
        <div className="container-site">
          <SectionHeading
            eyebrow="Why Choose Us"
            title="Why clients keep coming back"
            description="We're not the cheapest option in every market — we're the one that doesn't need replacing in a year."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Factory, title: "In-House Everything", text: "Design, fabrication, wiring and installation under one roof — full control over quality and deadlines." },
              { icon: Lightbulb, title: "Free 3D Mockups", text: "See your sign on your actual wall before paying a rupee. Unlimited revisions until it's right." },
              { icon: ShieldCheck, title: "Branded LEDs & Warranty", text: "We use rated LED chips and outdoor-grade materials — with real warranties and service support." },
              { icon: Truck, title: "Nationwide Delivery", text: "Installed crews in every major city, courier delivery for smaller items, nationwide coverage." },
              { icon: HeartHandshake, title: "Honest Pricing", text: "Itemized quotes with no hidden charges. Prices locked at order time." },
              { icon: Users, title: "Every Client Matters", text: "A family name plate gets the same design attention as a hospital campus — that's our promise." },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border bg-white p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-primary">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-display text-base font-bold text-zinc-900">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service area */}
      <section className="bg-zinc-50 py-14">
        <div className="container-site text-center">
          <SectionHeading
            eyebrow="Where We Work"
            title="Serving businesses across Pakistan"
          />
          <div className="flex flex-wrap justify-center gap-3">
            {SITE.cities.map((c) => (
              <span key={c} className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-5 py-2.5 font-display text-sm font-bold text-zinc-800 shadow-sm">
                <MapPin className="h-4 w-4 text-primary" aria-hidden="true" /> {c}
              </span>
            ))}
            <span className="flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-2.5 font-display text-sm font-bold text-white">
              <Award className="h-4 w-4 text-primary" aria-hidden="true" /> + nationwide delivery
            </span>
          </div>
          <Button size="lg" className="mt-10 rounded-full px-8 font-bold" onClick={() => navigate("/quote")}>
            <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" /> Get a Free Quote
          </Button>
        </div>
      </section>
    </div>
  );
}
