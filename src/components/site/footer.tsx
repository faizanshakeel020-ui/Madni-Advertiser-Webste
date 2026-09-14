"use client";

import Image from "next/image";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "./icons";
import { SITE, whatsappUrl } from "@/lib/constants";
import { useContent } from "@/lib/content";
import { useRoute } from "@/lib/router";
import { useCart } from "@/store/cart";
import { fetchCategories } from "@/lib/api";
import { useEffect, useState } from "react";
import type { Category } from "@/lib/types";
import { SocialIcon } from "@/lib/social";

export function Footer() {
  const { navigate } = useRoute();
  const { services: SERVICES, socialLinks } = useContent();
  const [cats, setCats] = useState<Category[]>([]);
  const items = useCart((s) => s.items);

  useEffect(() => {
    let alive = true;
    fetchCategories()
      .then((c) => alive && setCats(c))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return (
    <footer className="mt-auto bg-zinc-950 text-zinc-300">
      <div className="container-site grid gap-8 py-12 sm:grid-cols-2 sm:gap-10 lg:grid-cols-4 lg:py-16">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2.5">
            <Image
              src="/images/logo.png"
              alt="Madni Advertiser logo"
              width={96}
              height={96}
              className="h-20 w-20 object-contain sm:h-24 sm:w-24"
            />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-zinc-400">
            {SITE.name} designs, manufactures and installs 3D, LED, acrylic and digital
            signage for businesses and homes across Pakistan — since {new Date().getFullYear() - SITE.stats.years}.
          </p>
          <div className="mt-5 flex gap-2">
            {socialLinks.map(({ url, platform }) => (
              <a
                key={`${platform}-${url}`}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={platform}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-zinc-300 transition-colors hover:bg-primary hover:text-white"
              >
                <SocialIcon platform={platform} className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Services */}
        <nav aria-label="Services">
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">Services</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {SERVICES.map((s) => (
              <li key={s.slug}>
                <button
                  onClick={() => navigate(`/services/${s.slug}`)}
                  className="text-zinc-400 transition-colors hover:text-primary"
                >
                  {s.name}
                </button>
              </li>
            ))}
            <li>
              <button
                onClick={() => navigate("/services")}
                className="font-semibold text-primary hover:text-primary/80"
              >
                View All Services →
              </button>
            </li>
          </ul>
        </nav>

        {/* Shop */}
        <nav aria-label="Shop categories">
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">Shop</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {(cats.length ? cats : []).slice(0, 7).map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => navigate(`/shop?cat=${c.slug}`)}
                  className="text-zinc-400 transition-colors hover:text-primary"
                >
                  {c.name}
                </button>
              </li>
            ))}
            <li>
              <button onClick={() => navigate("/shop")} className="font-semibold text-primary hover:text-primary/80">
                Browse Full Shop →
              </button>
            </li>
          </ul>
        </nav>

        {/* Contact */}
        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">Contact</h3>
          <ul className="mt-4 space-y-3 text-sm text-zinc-400">
            <li className="flex gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <a href={SITE.mapsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline">
                {SITE.address}
              </a>
            </li>
            <li>
              <a href={SITE.phoneHref} className="flex gap-2.5 hover:text-primary">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>
                  <span className="block">{SITE.phone}</span>
                  <span className="block text-xs font-semibold text-primary">{SITE.phoneContactName}</span>
                </span>
              </a>
            </li>
            <li>
              <a href={SITE.emailHref} className="flex gap-2.5 hover:text-primary">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                {SITE.email}
              </a>
            </li>
            <li className="flex gap-2.5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              {SITE.hours}
            </li>
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="border-emerald-500 bg-transparent font-bold text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-400">
                <WhatsAppIcon className="mr-1.5 h-4 w-4" /> WhatsApp
              </Button>
            </a>
            <Button
              size="sm"
              variant="outline"
              className="border-white/20 bg-transparent font-bold text-white hover:bg-white/10 hover:text-white"
              onClick={() => navigate("/quote")}
            >
              Get a Quote
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container-site flex flex-col items-center justify-between gap-3 py-5 text-xs text-zinc-500 sm:flex-row">
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2" aria-label="Quick links">
            <button onClick={() => navigate("/about")} className="hover:text-primary">About</button>
            <button onClick={() => navigate("/portfolio")} className="hover:text-primary">Portfolio</button>
            <button onClick={() => navigate("/contact")} className="hover:text-primary">Contact</button>
            <button onClick={() => navigate("/cart")} className="hover:text-primary">
              Cart{items.length ? ` (${items.length})` : ""}
            </button>
            <button onClick={() => navigate("/admin")} className="text-zinc-600 hover:text-zinc-300">Admin</button>
          </nav>
          <p>
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
