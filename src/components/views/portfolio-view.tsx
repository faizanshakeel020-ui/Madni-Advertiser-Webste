"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, MapPin, Maximize2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SectionHeading } from "@/components/site/section-heading";
import { useRoute } from "@/lib/router";
import { useContent } from "@/lib/content";
import { MediaImg } from "@/components/site/media-img";
import type { PortfolioProject } from "@/lib/types";

export function PortfolioView() {
  const { route, navigate } = useRoute();
  const { portfolio: PORTFOLIO, portfolioCategories: PORTFOLIO_CATEGORIES } = useContent();
  const filter = route.query.cat ?? "All";
  const [lightbox, setLightbox] = useState<PortfolioProject | null>(null);

  const projects = filter === "All" ? PORTFOLIO : PORTFOLIO.filter((p) => p.category === filter);

  const setFilter = (c: string) => {
    navigate(c === "All" ? "/portfolio" : `/portfolio?cat=${c}`, { replace: true });
  };

  return (
    <div>
      {/* Header */}
      <div className="relative overflow-hidden bg-zinc-950 py-14 lg:py-20">
        { }
        <img
          src="/images/proj-building.png"
          alt="Illuminated building signage project"
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/70 to-zinc-950/20" aria-hidden="true" />
        <div className="container-site relative">
          <p className="mb-2 font-display text-xs font-bold uppercase tracking-[0.2em] text-primary">Our Portfolio</p>
          <h1 className="font-display text-3xl font-bold text-white lg:text-5xl">Projects We&apos;re Proud Of</h1>
          <p className="mt-3 max-w-2xl text-sm text-zinc-300 sm:text-base">
            Restaurants to hospitals, single signs to full campuses — a look at the work our
            clients display every day.
          </p>
        </div>
      </div>

      <div className="container-site py-10 lg:py-14">
        {/* Filter chips */}
        <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filter projects by type">
          {PORTFOLIO_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                filter === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-zinc-300 bg-white text-zinc-600 hover:border-primary/50 hover:text-primary"
              }`}
              aria-pressed={filter === c}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setLightbox(p)}
              className="group relative overflow-hidden rounded-2xl text-left shadow-sm transition-shadow hover:shadow-lg"
              aria-label={`View ${p.title}`}
            >
              <div className="aspect-[4/3] overflow-hidden bg-zinc-100">
                { }
                <MediaImg src={p.image} alt={p.title} className="h-full w-full object-cover img-zoom" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-950/20 to-transparent" aria-hidden="true" />
              <div className="absolute left-3 top-3">
                <Badge variant="secondary" className="bg-white/90 text-zinc-800 hover:bg-white/90">{p.category}</Badge>
              </div>
              <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                <Maximize2 className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="font-display text-base font-bold text-white">{p.title}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-300">
                  <MapPin className="h-3 w-3" aria-hidden="true" /> {p.client} · {p.city}
                </p>
              </div>
            </button>
          ))}
        </div>

        {projects.length === 0 && (
          <p className="py-16 text-center text-sm text-zinc-500">No projects in this category yet.</p>
        )}
      </div>

      {/* CTA strip */}
      <div className="container-site pb-14">
        <div className="overflow-hidden rounded-2xl bg-zinc-950 px-6 py-10 text-center">
          <SectionHeading
            dark
            title="Your project could be next"
            description="Join 2,500+ businesses that trusted us with the sign that represents them every day."
          />
          <PortfolioCTAButton />
        </div>
      </div>

      {/* Lightbox */}
      <Dialog open={!!lightbox} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent className="max-w-3xl border-zinc-800 bg-zinc-950 p-0 sm:rounded-2xl">
          {lightbox && (
            <>
              <DialogTitle className="sr-only">{lightbox.title}</DialogTitle>
              <DialogDescription className="sr-only">
                {lightbox.description} — {lightbox.client}, {lightbox.city}
              </DialogDescription>
              { }
              <MediaImg src={lightbox.image} alt={lightbox.title} loading="eager" className="max-h-[60vh] w-full rounded-t-xl object-cover" />
              <div className="relative p-5 text-white">
                <button
                  onClick={() => setLightbox(null)}
                  className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-zinc-300 hover:bg-white/20"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
                <Badge className="bg-primary text-primary-foreground hover:bg-primary">{lightbox.category}</Badge>
                <h3 className="mt-2 font-display text-xl font-bold">{lightbox.title}</h3>
                <p className="mt-1 text-sm text-zinc-400">
                  {lightbox.client} · <MapPin className="inline h-3 w-3" aria-hidden="true" /> {lightbox.city}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-zinc-300">{lightbox.description}</p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PortfolioCTAButton() {
  const { navigate } = useRoute();
  return (
    <Button size="lg" className="rounded-full px-8 font-bold" onClick={() => navigate("/quote")}>
      <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" /> Start Your Project
    </Button>
  );
}
