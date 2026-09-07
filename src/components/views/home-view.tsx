"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Factory,
  Lightbulb,
  MapPin,
  Ruler,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Truck,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeading } from "@/components/site/section-heading";
import { ProductCard } from "@/components/site/product-card";
import { useRoute } from "@/lib/router";
import { fetchCategories, fetchProducts } from "@/lib/api";
import { PORTFOLIO, SERVICES } from "@/lib/services-data";
import { SITE } from "@/lib/constants";
import type { Category, Product } from "@/lib/types";

const SLIDES = [
  {
    image: "/images/hero-1.png",
    eyebrow: "Signage & Display Advertising",
    title: "Signs That Make Your Business Shine",
    subtitle:
      "Custom 3D, LED, acrylic and digital signage designed, fabricated and installed across Pakistan — for shops, offices, hotels, hospitals and homes.",
  },
  {
    image: "/images/hero-2.png",
    eyebrow: "Indoor Branding",
    title: "Reception Walls That Wow Every Visitor",
    subtitle:
      "Backlit logo walls, halo letters and complete interior branding — crafted in-house, installed after hours, guaranteed to impress.",
  },
  {
    image: "/images/hero-3.png",
    eyebrow: "Digital Signage",
    title: "Screens That Sell While You Sleep",
    subtitle:
      "LED video walls, digital menu boards and smart displays with cloud content management — change your message from your phone.",
  },
];

export function HomeView() {
  const { navigate } = useRoute();
  const [emblaRef, embla] = useEmblaCarousel({ loop: true, duration: 25 });
  const [selected, setSelected] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([fetchCategories(), fetchProducts({ featured: true, per: 8, sort: "popular" })])
      .then(([cats, prods]) => {
        if (!alive) return;
        setCategories(cats);
        setFeatured(prods.items);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  // hero autoplay
  useEffect(() => {
    const t = setInterval(() => embla?.scrollNext(), 6000);
    return () => clearInterval(t);
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setSelected(embla.selectedScrollSnap());
    embla.on("select", onSelect);
    return () => {
      embla.off("select", onSelect);
    };
  }, [embla]);

  return (
    <div>
      {/* ================= 1. HERO SLIDER — photography-first ================= */}
      <section className="relative bg-zinc-950" aria-label="Featured projects">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {SLIDES.map((slide, i) => (
              <div key={i} className="relative min-w-0 flex-[0_0_100%]">
                {/* hero fills the open viewport (minus header bars) so the caption is always readable on load */}
                <div className="relative h-[calc(100svh-128px)] min-h-[400px] max-h-[620px] w-full sm:h-[calc(100svh-144px)] lg:h-[calc(100svh-152px)]">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="h-full w-full object-cover"
                    loading={i === 0 ? "eager" : "lazy"}
                    fetchPriority={i === 0 ? "high" : "auto"}
                  />
                  {/* subtle bottom gradient for caption/arrows legibility */}
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-950/20 to-transparent"
                    aria-hidden="true"
                  />
                  {/* caption — bottom left, padded clear of the right-edge arrows */}
                  <div className="container-site absolute inset-x-0 bottom-0">
                    <div className="max-w-2xl pb-14 pr-14 sm:pb-16 sm:pr-20">
                      <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
                        {slide.eyebrow}
                      </p>
                      <h1 className="mt-2 font-display text-2xl font-bold leading-[1.12] text-white sm:text-4xl lg:text-5xl">
                        {slide.title}
                      </h1>
                      <p className="mt-3 hidden max-w-lg text-sm leading-relaxed text-zinc-200/90 sm:block">
                        {slide.subtitle}
                      </p>
                      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <Button
                          size="lg"
                          className="h-11 rounded-[4px] px-7 text-sm font-bold uppercase tracking-wider"
                          onClick={() => navigate("/shop")}
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" aria-hidden="true" />
                          Shop Products
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          className="h-11 rounded-[4px] border-white/40 bg-white/10 px-7 text-sm font-bold uppercase tracking-wider text-white backdrop-blur hover:bg-white hover:text-zinc-900"
                          onClick={() => navigate("/quote")}
                        >
                          Get a Free Quote
                          <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* circular translucent arrows — stacked on the right edge so they never overlap the caption at any hero height */}
        <div className="absolute right-4 top-1/2 flex -translate-y-1/2 flex-col gap-2.5">
          <button
            onClick={() => embla?.scrollPrev()}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/60 md:h-11 md:w-11"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            onClick={() => embla?.scrollNext()}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/60 md:h-11 md:w-11"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2" role="tablist" aria-label="Slides">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={selected === i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => embla?.scrollTo(i)}
              className={`h-2.5 rounded-full transition-all ${selected === i ? "w-8 bg-primary" : "w-2.5 bg-white/40 hover:bg-white/70"}`}
            />
          ))}
        </div>
      </section>

      {/* ================= 2. SHOP BY CATEGORY ================= */}
      <section className="bg-zinc-50 py-14 lg:py-20" aria-label="Shop by category">
        <div className="container-site">
          <SectionHeading
            eyebrow="Ready-Made & Customizable"
            title="Shop by Category"
            description="Browse our best-selling signage — order ready-made products directly, or request a free quote for custom sizes."
          />
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => navigate(`/shop?cat=${cat.slug}`)}
                  className="group relative overflow-hidden rounded-xl text-left shadow-sm transition-shadow hover:shadow-lg"
                  aria-label={`Shop ${cat.name}`}
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-zinc-100">
                    { }
                    <img
                      src={cat.image ?? "/images/p-led-backlit.png"}
                      alt={`${cat.name} category`}
                      loading="lazy"
                      className="h-full w-full object-cover img-zoom"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-950/25 to-transparent" aria-hidden="true" />
                  <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                    <p className="font-display text-sm font-bold leading-tight text-white sm:text-base">{cat.name}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-zinc-300">
                      {cat.productCount ?? 0} products
                      <ArrowRight className="h-3 w-3 text-primary transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ================= 3. OUR SERVICES ================= */}
      <section className="py-14 lg:py-20" aria-label="Our services">
        <div className="container-site">
          <SectionHeading
            eyebrow="What We Do"
            title="Our Services"
            description="End-to-end signage solutions — design, fabrication, installation and maintenance for every industry."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s, idx) => (
              <button
                key={s.slug}
                onClick={() => navigate(`/services/${s.slug}`)}
                className={`group relative overflow-hidden rounded-2xl text-left shadow-sm transition-shadow hover:shadow-xl ${
                  idx === 0 ? "sm:col-span-2 lg:col-span-1" : ""
                }`}
              >
                <div className="aspect-[16/10] w-full overflow-hidden bg-zinc-100">
                  { }
                  <img src={s.hero} alt={`${s.name} service`} loading="lazy" className="h-full w-full object-cover img-zoom" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/35 to-transparent" aria-hidden="true" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="font-display text-xl font-bold text-white sm:text-2xl">{s.name}</h3>
                  <p className="mt-1.5 text-xs font-medium uppercase tracking-wider text-primary">{s.tagline}</p>
                  <ul className="mt-3 hidden flex-wrap gap-x-3 gap-y-1 sm:flex">
                    {s.subServices.map((sub) => (
                      <li key={sub.name} className="text-xs text-zinc-300">· {sub.name}</li>
                    ))}
                  </ul>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-white">
                    Explore Service
                    <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 4. FEATURED PRODUCTS ================= */}
      <section className="bg-zinc-50 py-14 lg:py-20" aria-label="Featured products">
        <div className="container-site">
          <div className="mb-8 flex flex-col items-center justify-between gap-4 sm:mb-10 sm:flex-row">
            <div className="text-center sm:text-left">
              <p className="mb-2 font-display text-xs font-bold uppercase tracking-[0.2em] text-primary">Best Sellers</p>
              <h2 className="font-display text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl lg:text-4xl">
                Featured Products
              </h2>
            </div>
            <Button variant="outline" className="rounded-full font-bold" onClick={() => navigate("/shop")}>
              View All Products <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ================= 5. WHY CHOOSE US ================= */}
      <section className="py-14 lg:py-20" aria-label="Why choose us">
        <div className="container-site">
          <SectionHeading
            eyebrow="Our Specialities"
            title="Why Businesses Choose Madni Advertiser"
            description="From a single name plate to a full building rebrand — we bring the same care, quality and speed to every project."
          />
          <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Factory, title: "100% In-House Fabrication", text: "Our own workshop with CNC routers, laser cutters and acrylic bending — no middlemen, better prices and faster delivery." },
              { icon: Lightbulb, title: "Free Design & Mockup", text: "Every project starts with a free 3D mockup of your sign on your actual shop or wall, so you know exactly what you're getting." },
              { icon: Truck, title: "Nationwide Installation", text: `Professional installation crews across ${SITE.stats.cities} cities — with safety rigging for high-rise and rooftop work.` },
              { icon: ShieldCheck, title: "Premium LED & Materials", text: "We use branded LED chips and weather-proof materials with warranties — signs that stay bright for years, not months." },
              { icon: BadgeCheck, title: `${SITE.stats.years}+ Years of Experience`, text: `Trusted by ${SITE.stats.clients}+ businesses — from street-corner shops to hospitals, hotels and malls.` },
              { icon: Wrench, title: "After-Sales Support", text: "Something not glowing right? Our service teams fix and maintain signs long after installation day." },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-zinc-900">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 6. RECENT PROJECTS ================= */}
      <section className="bg-zinc-50 py-14 lg:py-20" aria-label="Recent projects">
        <div className="container-site">
          <SectionHeading
            eyebrow="Our Work"
            title="Recent Projects"
            description="A glimpse of what we've built for clients across Pakistan — from glowing storefronts to full wayfinding systems."
          />
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {PORTFOLIO.slice(0, 6).map((p) => (
              <button
                key={p.id}
                onClick={() => navigate("/portfolio")}
                className="group relative overflow-hidden rounded-xl text-left"
                aria-label={`View project: ${p.title}`}
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-zinc-100">
                  { }
                  <img src={p.image} alt={p.title} loading="lazy" className="h-full w-full object-cover img-zoom" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent opacity-90" aria-hidden="true" />
                <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                  <Badge variant="secondary" className="mb-1.5 bg-white/90 text-zinc-800 hover:bg-white/90">{p.category}</Badge>
                  <p className="line-clamp-1 font-display text-sm font-bold text-white sm:text-base">{p.title}</p>
                  <p className="flex items-center gap-1 text-xs text-zinc-300">
                    <MapPin className="h-3 w-3" aria-hidden="true" /> {p.city}
                  </p>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button variant="outline" size="lg" className="rounded-full font-bold" onClick={() => navigate("/portfolio")}>
              View Full Portfolio <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </section>

      {/* ================= 7. TRUST STRIP ================= */}
      <section className="bg-zinc-950 py-12" aria-label="Company statistics">
        <div className="container-site">
          <div className="grid grid-cols-2 gap-6 text-center sm:grid-cols-4 sm:gap-4">
            {[
              { value: `${SITE.stats.years}+`, label: "Years in Business" },
              { value: `${SITE.stats.projects}+`, label: "Projects Completed" },
              { value: `${SITE.stats.cities}`, label: "Cities Served" },
              { value: `${SITE.stats.clients}+`, label: "Happy Clients" },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-display text-3xl font-bold text-primary sm:text-4xl">{s.value}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wider text-zinc-400 sm:text-sm">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Client types marquee */}
          <div className="relative mt-10 overflow-hidden border-y border-white/10 py-4" aria-hidden="true">
            <div className="animate-marquee flex w-max items-center gap-10">
              {[...Array(2)].map((_, dup) => (
                <div key={dup} className="flex items-center gap-10">
                  {["RESTAURANTS", "HOTELS", "HOSPITALS", "SCHOOLS", "MALLS", "CORPORATE OFFICES", "RETAIL SHOPS", "GYMS & CAFES"].map((c) => (
                    <span key={c} className="flex items-center gap-2 font-display text-sm font-bold tracking-widest text-zinc-500">
                      <Award className="h-4 w-4 text-primary/60" aria-hidden="true" />
                      {c}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= 8. CTA BANNER ================= */}
      <section className="relative overflow-hidden py-16 lg:py-24" aria-label="Get a quote">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" aria-hidden="true" />
        <div
          className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/20 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="container-site relative text-center">
          <Ruler className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
          <h2 className="mx-auto mt-4 max-w-2xl font-display text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
            Need a custom sign? Get a free quote today.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-300 sm:text-base">
            Tell us about your project and receive a free quote with a 3D design mockup —
            no obligation, delivered within hours.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" className="h-12 rounded-full px-8 font-bold" onClick={() => navigate("/quote")}>
              Get a Free Quote <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
            <a href={SITE.phoneHref}>
              <Button
                size="lg"
                variant="outline"
                className="h-12 w-full rounded-full border-white/30 bg-transparent px-8 font-bold text-white hover:bg-white hover:text-zinc-900 sm:w-auto"
              >
                Call {SITE.phone}
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
