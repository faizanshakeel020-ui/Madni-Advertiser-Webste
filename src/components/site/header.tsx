"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Menu, Search, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { SERVICES } from "@/lib/services-data";
import { useRoute } from "@/lib/router";
import { useCart, cartCount } from "@/store/cart";
import { useMounted } from "@/lib/use-mounted";

export function Header() {
  const { route, navigate } = useRoute();
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = useCart((s) => s.items);
  const count = cartCount(items);
  const mounted = useMounted();

  // close overlays when route changes (back/forward hash navigation)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing UI with external hash route
    setMegaOpen(false);
    setMobileOpen(false);
  }, [route.path, route.query.q, route.query.cat]);

  const isActive = (href: string) =>
    href === "/" ? route.path === "/" : route.path.startsWith(href);

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
        onMouseLeave={() => setMegaOpen(false)}
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
                    {NAV_LINKS.filter((l) => !l.mega).map((link) => (
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

                  <Accordion type="single" collapsible>
                    <AccordionItem value="services" className="border-y">
                      <AccordionTrigger className="px-3 py-2.5 text-[15px] font-bold text-zinc-800 hover:no-underline">
                        Services
                      </AccordionTrigger>
                      <AccordionContent className="pb-2">
                        {SERVICES.map((s) => (
                          <div key={s.slug} className="mb-1">
                            <button
                              onClick={() => navigate(`/services/${s.slug}`)}
                              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-bold text-zinc-700 hover:bg-zinc-100"
                            >
                              {s.name}
                            </button>
                            <div className="ml-3 border-l-2 border-zinc-100 pl-2">
                              {s.subServices.map((sub) => (
                                <button
                                  key={sub.name}
                                  onClick={() => navigate(`/services/${s.slug}`)}
                                  className="block w-full rounded-md px-3 py-1.5 text-left text-[13px] text-zinc-500 hover:text-primary"
                                >
                                  {sub.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

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
                link.mega ? (
                  <button
                    key={link.href}
                    onMouseEnter={() => setMegaOpen(true)}
                    onClick={() => navigate(link.href)}
                    className={`flex items-center gap-1 text-[13px] font-semibold uppercase tracking-widest transition-colors ${
                      isActive(link.href)
                        ? "text-primary"
                        : "text-white hover:text-zinc-300"
                    }`}
                    aria-expanded={megaOpen}
                    aria-haspopup="true"
                  >
                    {link.label}
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${megaOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    key={link.href}
                    onMouseEnter={() => setMegaOpen(false)}
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

        {/* ---------- Mega menu (desktop) ---------- */}
        {megaOpen && (
          <div
            className="absolute inset-x-0 top-full hidden border-b border-zinc-100 bg-white shadow-xl shadow-zinc-950/10 lg:block"
            onMouseEnter={() => setMegaOpen(true)}
          >
            <div className="container-site grid grid-cols-5 gap-8 py-8">
              {SERVICES.slice(0, 4).map((s) => (
                <div key={s.slug}>
                  <button
                    onClick={() => navigate(`/services/${s.slug}`)}
                    className="mb-3 flex items-center gap-2 text-left font-display text-sm font-bold uppercase tracking-wider text-zinc-900 hover:text-primary"
                  >
                    {s.name}
                  </button>
                  <ul className="space-y-1.5">
                    {s.subServices.map((sub) => (
                      <li key={sub.name}>
                        <button
                          onClick={() => navigate(`/services/${s.slug}`)}
                          className="text-left text-sm text-zinc-600 hover:text-primary transition-colors"
                        >
                          {sub.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {/* Featured promo card */}
              <button
                onClick={() => navigate("/services/exhibition")}
                className="group relative overflow-hidden rounded-xl text-left"
                aria-label="Exhibition stands service"
              >
                <img
                  src="/images/service-exhibition.png"
                  alt="Custom exhibition stands and brand activations"
                  className="h-40 w-full object-cover img-zoom"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/30 to-transparent" aria-hidden="true" />
                <div className="absolute bottom-0 p-4">
                  <Badge className="mb-1.5 bg-primary text-primary-foreground">Featured</Badge>
                  <p className="font-display text-sm font-bold text-white">Exhibition Stands</p>
                  <p className="text-xs text-zinc-300">Custom booths for expos & events</p>
                </div>
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
