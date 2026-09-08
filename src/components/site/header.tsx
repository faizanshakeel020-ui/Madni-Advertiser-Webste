"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Menu, Search, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Logo } from "./logo";
import { WhatsAppIcon } from "./icons";
import { NAV_LINKS, SITE, whatsappUrl } from "@/lib/constants";
import { useContent } from "@/lib/content";
import { MediaImg } from "@/components/site/media-img";
import { useRoute } from "@/lib/router";
import { useCart, cartCount } from "@/store/cart";
import { useMounted } from "@/lib/use-mounted";
import { fetchCategories, fetchClients } from "@/lib/api";
import { subcategoryIcon } from "@/lib/category-icons";
import type { Category, Client } from "@/lib/types";

type Menu = "services" | "shop" | "portfolio" | null;

export function Header() {
  const { route, navigate } = useRoute();
  const { services: SERVICES, portfolioCategories: PORTFOLIO_CATEGORIES } = useContent();
  const [openMenu, setOpenMenu] = useState<Menu>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cats, setCats] = useState<Category[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [shopCat, setShopCat] = useState("");
  const [svCat, setSvCat] = useState("");
  const items = useCart((s) => s.items);
  const count = cartCount(items);
  const mounted = useMounted();

  useEffect(() => {
    let alive = true;
    fetchCategories()
      .then((c) => alive && setCats(c))
      .catch(() => {});
    fetchClients()
      .then((c) => alive && setClients(c))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // close overlays when route changes (back/forward hash navigation)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing UI with external hash route
    setOpenMenu(null);
    setMobileOpen(false);
  }, [route.path, route.query.q, route.query.cat, route.query.sub]);

  const isActive = (href: string) =>
    href === "/" ? route.path === "/" : route.path.startsWith(href);

  // Active category inside the Shop mega menu: user-hovered → current shop category → first
  const activeShopCat =
    cats.find((c) => c.slug === shopCat) ??
    cats.find((c) => c.slug === route.query.cat) ??
    cats[0];

  // Active service inside the Services mega menu: user-hovered → current service page → first
  const activeService =
    SERVICES.find((s) => s.slug === svCat) ??
    (route.path.startsWith("/services/")
      ? SERVICES.find((s) => s.slug === route.path.split("/")[2])
      : undefined) ??
    SERVICES[0];

  return (
    <>
      {/* ---------- Top utility bar (light gray) ---------- */}
      <div className="border-b border-zinc-300/70 bg-zinc-200">
        <div className="container-site flex h-20 items-center justify-between gap-4 sm:h-[88px] lg:h-24">
          <Logo />

          {/* Contact blocks */}
          <div className="hidden items-center gap-10 md:flex">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Call Us</p>
              <a
                href={SITE.phoneHref}
                className="mt-0.5 block text-sm font-bold text-zinc-900 transition-colors hover:text-primary"
              >
                {SITE.phone}
              </a>
            </div>
            <div className="hidden lg:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Email</p>
              <a
                href={SITE.emailHref}
                className="mt-0.5 block text-sm font-bold text-zinc-900 transition-colors hover:text-primary"
              >
                {SITE.email}
              </a>
            </div>
          </div>

          <Button
            size="sm"
            className="h-9 rounded-[3px] bg-zinc-950 px-5 text-xs font-bold uppercase tracking-wider text-white shadow-none hover:bg-zinc-800 hover:text-white sm:text-sm border-b-2 border-b-primary"
            onClick={() => navigate("/quote")}
          >
            Get Quote
          </Button>
        </div>
      </div>

      {/* ---------- Main nav bar (black, sticky) ---------- */}
      <header
        className="sticky top-0 z-50 bg-zinc-950 shadow-md"
        onMouseLeave={() => setOpenMenu(null)}
      >
        <div className="container-site flex h-12 items-center justify-between gap-4 lg:h-14">
          <div className="flex items-center gap-8">
            {/* Mobile hamburger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 lg:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[320px] overflow-y-auto p-0">
                <SheetHeader className="border-b p-4">
                  <SheetTitle className="text-left">
                    <Logo />
                  </SheetTitle>
                </SheetHeader>
                <div className="p-4 space-y-4">
                  <form
                    className="relative"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value.trim();
                      navigate(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
                    }}
                    role="search"
                  >
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
                    <Input name="q" placeholder="Search products…" className="h-11 rounded-full pl-9" aria-label="Search shop products" />
                  </form>

                  <nav className="space-y-1" aria-label="Mobile navigation">
                    {/* Home — first plain link */}
                    {(() => {
                      const home = NAV_LINKS.find((l) => !l.menu);
                      return home ? (
                        <button
                          onClick={() => navigate(home.href)}
                          className={`block w-full rounded-lg px-3 py-2.5 text-left text-[15px] font-bold ${
                            isActive(home.href) ? "bg-accent text-accent-foreground" : "text-zinc-800 hover:bg-zinc-100"
                          }`}
                        >
                          {home.label}
                        </button>
                      ) : null;
                    })()}

                    {/* Services / Shop / Portfolio — one dropdown each, same order as the navbar */}
                    <Accordion type="single" collapsible>
                      {/* ---- Services dropdown ---- */}
                      <AccordionItem value="services" className="border-y">
                        <AccordionTrigger
                          className={`px-3 py-2.5 text-left text-[15px] font-bold hover:no-underline ${
                            isActive("/services") ? "text-primary" : "text-zinc-800"
                          }`}
                        >
                          Services
                        </AccordionTrigger>
                        <AccordionContent className="pb-3">
                          {SERVICES.map((s) => (
                            <div key={s.slug} className="mb-1">
                              <button
                                onClick={() => navigate(`/services/${s.slug}`)}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-bold text-zinc-700 hover:bg-zinc-100"
                              >
                                <span className="h-8 w-8 shrink-0 overflow-hidden rounded-md">
                                  <MediaImg
                                    src={s.hero}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                </span>
                                <span className="flex-1">{s.name}</span>
                                <ChevronRight className="h-3.5 w-3.5 text-zinc-300" aria-hidden="true" />
                              </button>
                              <div className="ml-5 border-l-2 border-zinc-100 pl-2">
                                {s.subServices.map((sub) => (
                                  <button
                                    key={sub.name}
                                    onClick={() => navigate(`/services/${s.slug}`)}
                                    className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-[13px] text-zinc-500 hover:text-primary"
                                  >
                                    <span className="h-5 w-5 shrink-0 overflow-hidden rounded-sm border border-zinc-200">
                                      <MediaImg
                                        src={sub.image}
                                        alt=""
                                        className="h-full w-full object-cover"
                                      />
                                    </span>
                                    <span className="flex-1 truncate">{sub.name}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                          <button
                            onClick={() => navigate("/services")}
                            className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm font-bold text-primary hover:bg-zinc-100"
                          >
                            View All Services →
                          </button>
                        </AccordionContent>
                      </AccordionItem>

                      {/* ---- Shop dropdown ---- */}
                      <AccordionItem value="shop" className="border-b">
                        <AccordionTrigger
                          className={`px-3 py-2.5 text-left text-[15px] font-bold hover:no-underline ${
                            isActive("/shop") ? "text-primary" : "text-zinc-800"
                          }`}
                        >
                          Shop
                        </AccordionTrigger>
                        <AccordionContent className="pb-3">
                          {cats.map((c) => (
                            <div key={c.slug} className="mb-1">
                              <button
                                onClick={() => navigate(`/shop?cat=${c.slug}`)}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-bold text-zinc-700 hover:bg-zinc-100"
                              >
                                <span className="h-8 w-8 shrink-0 overflow-hidden rounded-md">
                                  <img
                                    src={c.image ?? "/images/p-acrylic-led-nameplate.png"}
                                    alt=""
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                  />
                                </span>
                                <span className="flex-1">{c.name}</span>
                                <ChevronRight className="h-3.5 w-3.5 text-zinc-300" aria-hidden="true" />
                              </button>
                              <div className="ml-5 border-l-2 border-zinc-100 pl-2">
                                {c.subcategories?.map((sub) => {
                                  const SubIcon = subcategoryIcon(sub.slug);
                                  return (
                                    <button
                                      key={sub.slug}
                                      onClick={() => navigate(`/shop?cat=${c.slug}&sub=${sub.slug}`)}
                                      className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-[13px] text-zinc-500 hover:text-primary"
                                    >
                                      <SubIcon className="h-3.5 w-3.5 shrink-0 text-primary/60" aria-hidden="true" />
                                      {sub.name}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                          <button
                            onClick={() => navigate("/shop")}
                            className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm font-bold text-primary hover:bg-zinc-100"
                          >
                            Browse Full Shop →
                          </button>
                        </AccordionContent>
                      </AccordionItem>

                      {/* ---- Portfolio dropdown ---- */}
                      <AccordionItem value="portfolio" className="border-b">
                        <AccordionTrigger
                          className={`px-3 py-2.5 text-left text-[15px] font-bold hover:no-underline ${
                            isActive("/portfolio") ? "text-primary" : "text-zinc-800"
                          }`}
                        >
                          Portfolio
                        </AccordionTrigger>
                        <AccordionContent className="pb-3">
                          <button
                            onClick={() => navigate("/portfolio")}
                            className="mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-bold text-zinc-700 hover:bg-zinc-100"
                          >
                            All Projects
                            <ChevronRight className="h-3.5 w-3.5 text-zinc-300" aria-hidden="true" />
                          </button>
                          <div className="ml-3 border-l-2 border-zinc-100 pl-2">
                            {PORTFOLIO_CATEGORIES.filter((c) => c !== "All").map((c) => (
                              <button
                                key={c}
                                onClick={() => navigate(`/portfolio?cat=${encodeURIComponent(c)}`)}
                                className="block w-full rounded-md px-3 py-1.5 text-left text-[13px] text-zinc-500 hover:text-primary"
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                          {clients.length > 0 && (
                            <>
                              <p className="mb-1 mt-3 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400">
                                Client Case Studies
                              </p>
                              {clients.slice(0, 8).map((c) => (
                                <button
                                  key={c.id}
                                  onClick={() => navigate(`/casestudy/portfolio/${c.slug}`)}
                                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-left text-[13px] font-semibold text-zinc-600 hover:bg-zinc-100 hover:text-primary"
                                >
                                  <span className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-zinc-200">
                                    <img
                                      src={c.logo}
                                      alt=""
                                      className="h-full w-full object-cover"
                                      loading="lazy"
                                    />
                                  </span>
                                  <span className="flex-1 truncate">{c.name}</span>
                                </button>
                              ))}
                            </>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    {/* Remaining plain links — About Us / Contact Us */}
                    {NAV_LINKS.filter((l) => !l.menu && l.href !== "/").map((link) => (
                      <button
                        key={link.href}
                        onClick={() => navigate(link.href)}
                        className={`block w-full rounded-lg px-3 py-2.5 text-left text-[15px] font-bold ${
                          isActive(link.href) ? "bg-accent text-accent-foreground" : "text-zinc-800 hover:bg-zinc-100"
                        }`}
                      >
                        {link.label}
                      </button>
                    ))}
                  </nav>

                  <div className="space-y-2 pt-2">
                    <Button className="w-full font-bold" size="lg" onClick={() => navigate("/quote")}>
                      Get a Free Quote
                    </Button>
                    <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="block">
                      <Button variant="outline" size="lg" className="w-full border-emerald-500 font-bold text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700">
                        <WhatsAppIcon className="mr-2 h-4 w-4" /> WhatsApp Us
                      </Button>
                    </a>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Desktop nav — uppercase corporate style */}
            <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
              {NAV_LINKS.map((link) =>
                link.menu ? (
                  <button
                    key={link.href}
                    onMouseEnter={() => setOpenMenu(link.menu)}
                    onClick={() => navigate(link.href)}
                    className={`flex items-center gap-1 text-[13px] font-semibold uppercase tracking-widest transition-colors ${
                      isActive(link.href)
                        ? "text-primary"
                        : "text-white hover:text-zinc-300"
                    }`}
                    aria-expanded={openMenu === link.menu}
                    aria-haspopup="true"
                  >
                    {link.label}
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openMenu === link.menu ? "rotate-180" : ""}`} aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    key={link.href}
                    onMouseEnter={() => setOpenMenu(null)}
                    onClick={() => navigate(link.href)}
                    className={`text-[13px] font-semibold uppercase tracking-widest transition-colors ${
                      isActive(link.href)
                        ? "text-primary"
                        : "text-white hover:text-zinc-300"
                    }`}
                  >
                    {link.label}
                  </button>
                )
              )}
            </nav>
          </div>

          {/* Search + cart */}
          <div className="flex items-center gap-2 sm:gap-3">
            <form
              className="relative hidden xl:block"
              onSubmit={(e) => {
                e.preventDefault();
                const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value.trim();
                navigate(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
              }}
              role="search"
            >
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
              <Input
                name="q"
                placeholder="Search signs, neon, banners…"
                className="h-9 w-60 rounded-full border-white/15 bg-white/10 pl-9 text-sm text-white placeholder:text-zinc-500 focus-visible:border-primary focus-visible:ring-primary/40"
                aria-label="Search shop products"
              />
            </form>

            <button
              onClick={() => navigate("/shop")}
              className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 xl:hidden"
              aria-label="Search products"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </button>

            <button
              onClick={() => navigate("/cart")}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
              aria-label={`Cart — ${mounted ? count : 0} items`}
            >
              <ShoppingCart className="h-5 w-5" aria-hidden="true" />
              {mounted && count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground shadow">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ---------- Dropdown menus (desktop) ---------- */}
        {openMenu === "services" && (
          <div
            className="absolute inset-x-0 top-full hidden border-b border-zinc-100 bg-white shadow-xl shadow-zinc-950/10 lg:block"
            onMouseEnter={() => setOpenMenu("services")}
          >
            <div className="container-site py-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-display text-sm font-bold uppercase tracking-wider text-zinc-900">
                  Our Services
                </p>
                <button
                  onClick={() => navigate("/services")}
                  className="text-xs font-bold uppercase tracking-wider text-primary hover:underline"
                >
                  View All Services →
                </button>
              </div>
              <div className="grid grid-cols-[250px_1fr_190px] gap-5">
                {/* Left — service list with logo thumbnails */}
                <nav
                  className="max-h-[380px] overflow-y-auto rounded-xl bg-zinc-50 p-2 scrollbar-thin"
                  aria-label="Our services"
                >
                  {SERVICES.map((s) => {
                    const active = activeService?.slug === s.slug;
                    return (
                      <button
                        key={s.slug}
                        onMouseEnter={() => setSvCat(s.slug)}
                        onFocus={() => setSvCat(s.slug)}
                        onClick={() => navigate(`/services/${s.slug}`)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                          active
                            ? "bg-white text-zinc-900 shadow-sm"
                            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                        }`}
                        aria-current={active ? "true" : undefined}
                      >
                        <span
                          className={`h-9 w-9 shrink-0 overflow-hidden rounded-lg border ${
                            active ? "border-primary/60" : "border-zinc-200"
                          }`}
                        >
                          <MediaImg
                            src={s.hero}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-bold">{s.name}</span>
                        <ChevronRight
                          className={`h-3.5 w-3.5 shrink-0 ${active ? "text-primary" : "text-zinc-300"}`}
                          aria-hidden="true"
                        />
                      </button>
                    );
                  })}
                </nav>

                {/* Middle — sub-services of the active service */}
                <div className="min-w-0">
                  {activeService ? (
                    <>
                      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <div>
                          <p className="font-display text-base font-bold uppercase tracking-wide text-zinc-900">
                            {activeService.name}
                          </p>
                          <p className="mt-0.5 text-xs text-zinc-500">{activeService.tagline}</p>
                        </div>
                        <button
                          onClick={() => navigate(`/services/${activeService.slug}`)}
                          className="text-xs font-bold uppercase tracking-wider text-primary hover:underline"
                        >
                          View Service →
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {activeService.subServices.map((sub) => (
                          <button
                            key={sub.name}
                            onClick={() => navigate(`/services/${activeService.slug}`)}
                            className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-left transition-colors hover:border-primary/60 hover:bg-accent"
                          >
                            <span className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-zinc-100">
                              <MediaImg
                                src={sub.image}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13px] font-bold text-zinc-700">{sub.name}</span>
                              <span className="block truncate text-[11px] text-zinc-400">
                                {sub.description}
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                      <p className="mt-3 text-[11px] text-zinc-400">
                        Hover a service on the left to explore it — click any item to open the full service page.
                      </p>
                    </>
                  ) : (
                    <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-zinc-400">
                      Loading services…
                    </div>
                  )}
                </div>

                {/* Right — active service promo image */}
                {activeService?.hero && (
                  <button
                    onClick={() => navigate(`/services/${activeService.slug}`)}
                    className="group relative w-[190px] shrink-0 overflow-hidden rounded-xl text-left"
                    aria-label={`Open ${activeService.name} service page`}
                  >
                    <img
                      src={activeService.hero}
                      alt={activeService.name}
                      className="h-full min-h-[260px] w-full object-cover img-zoom"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/25 to-transparent" aria-hidden="true" />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <p className="font-display text-sm font-bold leading-tight text-white">{activeService.name}</p>
                      <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-primary group-hover:underline">
                        View Service →
                      </p>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {openMenu === "shop" && (
          <div
            className="absolute inset-x-0 top-full hidden border-b border-zinc-100 bg-white shadow-xl shadow-zinc-950/10 lg:block"
            onMouseEnter={() => setOpenMenu("shop")}
          >
            <div className="container-site py-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-display text-sm font-bold uppercase tracking-wider text-zinc-900">
                  Shop by Category
                </p>
                <button
                  onClick={() => navigate("/shop")}
                  className="text-xs font-bold uppercase tracking-wider text-primary hover:underline"
                >
                  Browse Full Shop →
                </button>
              </div>
              <div className="grid grid-cols-[250px_1fr_190px] gap-5">
                {/* Left navbar — only categories */}
                <nav
                  className="max-h-[380px] overflow-y-auto rounded-xl bg-zinc-50 p-2 scrollbar-thin"
                  aria-label="Shop categories"
                >
                  {cats.map((c) => {
                    const active = activeShopCat?.slug === c.slug;
                    return (
                      <button
                        key={c.slug}
                        onMouseEnter={() => setShopCat(c.slug)}
                        onFocus={() => setShopCat(c.slug)}
                        onClick={() => navigate(`/shop?cat=${c.slug}`)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                          active
                            ? "bg-white text-zinc-900 shadow-sm"
                            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                        }`}
                        aria-current={active ? "true" : undefined}
                      >
                        <span
                          className={`h-9 w-9 shrink-0 overflow-hidden rounded-lg border ${
                            active ? "border-primary/60" : "border-zinc-200"
                          }`}
                        >
                          <img
                            src={c.image ?? "/images/p-acrylic-led-nameplate.png"}
                            alt=""
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-bold">{c.name}</span>
                        <ChevronRight
                          className={`h-3.5 w-3.5 shrink-0 ${active ? "text-primary" : "text-zinc-300"}`}
                          aria-hidden="true"
                        />
                      </button>
                    );
                  })}
                </nav>

                {/* Middle panel — subcategories of the selected category */}
                <div className="min-w-0">
                  {activeShopCat ? (
                    <>
                      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <div>
                          <p className="font-display text-base font-bold uppercase tracking-wide text-zinc-900">
                            {activeShopCat.name}
                          </p>
                          {activeShopCat.description && (
                            <p className="mt-0.5 text-xs text-zinc-500">{activeShopCat.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => navigate(`/shop?cat=${activeShopCat.slug}`)}
                          className="text-xs font-bold uppercase tracking-wider text-primary hover:underline"
                        >
                          View All →
                        </button>
                      </div>
                      {activeShopCat.subcategories && activeShopCat.subcategories.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                          {activeShopCat.subcategories.map((sub) => {
                            const SubIcon = subcategoryIcon(sub.slug);
                            return (
                              <button
                                key={sub.slug}
                                onClick={() => navigate(`/shop?cat=${activeShopCat.slug}&sub=${sub.slug}`)}
                                className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-left transition-colors hover:border-primary/60 hover:bg-accent"
                              >
                                <SubIcon className="h-[18px] w-[18px] shrink-0 text-primary" aria-hidden="true" />
                                <span className="text-[13px] font-bold text-zinc-700">{sub.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed border-zinc-200 px-4 py-6 text-center">
                          <p className="text-sm text-zinc-500">
                            No subcategories yet — browse all {activeShopCat.name.toLowerCase()}.
                          </p>
                        </div>
                      )}
                      <p className="mt-3 text-[11px] text-zinc-400">
                        Select a subcategory to filter the shop, or view the full range above.
                      </p>
                    </>
                  ) : (
                    <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-zinc-400">
                      Loading categories…
                    </div>
                  )}
                </div>

                {/* Right — category promo image */}
                {activeShopCat && (
                  <button
                    onClick={() => navigate(`/shop?cat=${activeShopCat.slug}`)}
                    className="group relative w-[190px] shrink-0 overflow-hidden rounded-xl text-left"
                    aria-label={`Shop all ${activeShopCat.name}`}
                  >
                    <img
                      src={activeShopCat.image ?? "/images/p-acrylic-led-nameplate.png"}
                      alt={activeShopCat.name}
                      className="h-full min-h-[260px] w-full object-cover img-zoom"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/25 to-transparent" aria-hidden="true" />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <p className="font-display text-sm font-bold leading-tight text-white">{activeShopCat.name}</p>
                      <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-primary group-hover:underline">
                        Shop Now →
                      </p>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {openMenu === "portfolio" && (
          <div
            className="absolute inset-x-0 top-full hidden border-b border-zinc-100 bg-white shadow-xl shadow-zinc-950/10 lg:block"
            onMouseEnter={() => setOpenMenu("portfolio")}
          >
            <div className="container-site py-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-display text-sm font-bold uppercase tracking-wider text-zinc-900">
                  Explore Our Work
                </p>
                <button
                  onClick={() => navigate("/portfolio")}
                  className="text-xs font-bold uppercase tracking-wider text-primary hover:underline"
                >
                  View Full Portfolio →
                </button>
              </div>
              <div className="grid grid-cols-[240px_1fr_190px] gap-5">
                {/* Left — project categories */}
                <nav
                  className="max-h-[380px] overflow-y-auto rounded-xl bg-zinc-50 p-2 scrollbar-thin"
                  aria-label="Portfolio categories"
                >
                  <button
                    onClick={() => navigate("/portfolio")}
                    className="flex w-full items-center justify-between rounded-lg bg-white px-3 py-2 text-left text-sm font-bold text-zinc-900 shadow-sm"
                  >
                    All Projects
                    <ChevronRight className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  </button>
                  <div className="mt-1 space-y-0.5">
                    {PORTFOLIO_CATEGORIES.filter((c) => c !== "All").map((c) => (
                      <button
                        key={c}
                        onClick={() => navigate(`/portfolio?cat=${encodeURIComponent(c)}`)}
                        className="block w-full rounded-lg px-3 py-1.5 text-left text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-primary"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </nav>

                {/* Middle — client case studies */}
                <div className="min-w-0">
                  <p className="mb-3 font-display text-base font-bold uppercase tracking-wide text-zinc-900">
                    Client Case Studies
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {clients.length === 0 ? (
                      <p className="py-6 text-sm text-zinc-400">Loading case studies…</p>
                    ) : (
                      clients.slice(0, 8).map((c) => (
                        <button
                          key={c.id}
                          onClick={() => navigate(`/casestudy/portfolio/${c.slug}`)}
                          className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-left transition-colors hover:border-primary/60 hover:bg-accent"
                          aria-label={`View ${c.name} case study`}
                        >
                          <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-zinc-200">
                            <img
                              src={c.logo}
                              alt=""
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-bold text-zinc-800">{c.name}</span>
                            <span className="block truncate text-[11px] text-zinc-400">
                              {c.industry ?? `${c.projects.length} project${c.projects.length === 1 ? "" : "s"}`}
                            </span>
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                  <p className="mt-3 text-[11px] text-zinc-400">
                    Click any client to see the full project story — or filter the gallery by industry.
                  </p>
                </div>

                {/* Right — promo card */}
                <button
                  onClick={() => navigate("/quote")}
                  className="group relative w-[190px] shrink-0 overflow-hidden rounded-xl text-left"
                  aria-label="Start your project — get a free quote"
                >
                  <img
                    src="/images/proj-hotel.png"
                    alt="Custom hotel rooftop signage project"
                    className="h-full min-h-[260px] w-full object-cover img-zoom"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/25 to-transparent" aria-hidden="true" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="font-display text-sm font-bold leading-tight text-white">Your Sign Next?</p>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-primary group-hover:underline">
                      Get a Free Quote →
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
