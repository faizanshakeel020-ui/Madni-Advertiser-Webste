"use client";

/**
 * Case study page — /casestudy/portfolio/<client-slug>
 * Reached by clicking a client logo on the homepage. Shows that client's
 * delivered projects with full, long SEO-friendly descriptions.
 * Also sets per-page <title>, meta description and JSON-LD structured data.
 */
import { useEffect, useState } from "react";
import { ArrowLeft, Briefcase, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoute } from "@/lib/router";
import { fetchClients } from "@/lib/api";
import { SITE } from "@/lib/constants";
import type { Client } from "@/lib/types";

const DEFAULT_TITLE = "Madni Advertiser — Signage & Display Advertising in Lahore, Pakistan";

/** One-line, trimmed snippet for meta description / JSON-LD. */
function snippet(s: string, max = 300): string {
  return s.replace(/\s+/g, " ").trim().slice(0, max);
}

/**
 * Split a long description into readable paragraphs:
 * - keeps the author's/AI's own blank-line structure and bullet blocks,
 * - if the text is one unbroken wall, chunks it into ~80-word paragraphs
 *   at sentence boundaries.
 */
function splitParagraphs(text: string): string[] {
  const paras = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paras.length > 1) return paras;

  const block = paras[0] ?? "";
  if (countWords(block) < 120) return [block];

  const sentences = block.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [block];
  const out: string[] = [];
  let cur: string[] = [];
  let words = 0;
  for (const s of sentences) {
    cur.push(s.trim());
    words += countWords(s);
    if (words >= 80 && !s.trim().startsWith("•")) {
      out.push(cur.join(" "));
      cur = [];
      words = 0;
    }
  }
  if (cur.length) out.push(cur.join(" "));
  return out;
}

function countWords(s: string): number {
  return s.split(/\s+/).filter(Boolean).length;
}

export function CaseStudyView({ slug }: { slug: string }) {
  const { navigate } = useRoute();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchClients()
      .then((clients) => {
        if (!alive) return;
        setClient(clients.find((c) => c.slug === slug) ?? null);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [slug]);

  // ---------- Per-page SEO: <title>, meta description, JSON-LD ----------
  useEffect(() => {
    if (!client) return;
    const first = client.projects[0]?.description ?? "";
    document.title = `${client.name} Signage Case Study — ${SITE.name}`;

    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = snippet(
      first ||
        `${client.name} signage and branding projects designed, fabricated and installed by ${SITE.name} in Lahore, Pakistan.`,
      158
    );

    const jsonLd = document.createElement("script");
    jsonLd.type = "application/ld+json";
    jsonLd.id = "case-study-jsonld";
    jsonLd.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${client.name} signage projects by ${SITE.name}`,
      itemListElement: client.projects.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "CreativeWork",
          name: p.title,
          description: snippet(p.description),
          image: p.image,
          dateCreated: p.year ? String(p.year) : undefined,
          creator: { "@type": "Organization", name: SITE.name, address: SITE.address },
        },
      })),
    });
    document.head.appendChild(jsonLd);

    return () => {
      document.title = DEFAULT_TITLE;
      jsonLd.remove();
    };
  }, [client]);

  if (loading) {
    return (
      <div className="container-site space-y-6 py-12">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="container-site flex flex-col items-center py-24 text-center">
        <p className="font-display text-6xl font-bold text-primary">404</p>
        <h1 className="mt-3 font-display text-2xl font-bold text-zinc-900">Case study not found</h1>
        <p className="mt-2 text-sm text-zinc-500">
          We couldn&apos;t find a client case study at <span className="font-mono">/casestudy/portfolio/{slug}</span>.
        </p>
        <Button className="mt-6 rounded-full font-bold" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" /> Back to Home
        </Button>
      </div>
    );
  }

  const totalProjects = client.projects.length;

  return (
    <div>
      {/* ---------- Client hero ---------- */}
      <section className="relative overflow-hidden bg-zinc-950 py-14 lg:py-20" aria-label={client.name}>
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${client.projects[0]?.image ?? "/images/proj-building.png"})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/85 to-zinc-950/40" aria-hidden="true" />
        <div className="container-site relative">
          {/* breadcrumb */}
          <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs font-medium text-zinc-400" aria-label="Breadcrumb">
            <button onClick={() => navigate("/")} className="hover:text-primary">Home</button>
            <span aria-hidden="true">/</span>
            <button onClick={() => navigate("/portfolio")} className="hover:text-primary">Portfolio</button>
            <span aria-hidden="true">/</span>
            <span className="text-zinc-200">{client.name}</span>
          </nav>

          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <span className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-primary/60 bg-white shadow-xl sm:h-28 sm:w-28">
              <img src={client.logo} alt={`${client.name} logo`} className="h-full w-full object-cover" />
            </span>
            <div>
              <p className="mb-2 font-display text-xs font-bold uppercase tracking-[0.2em] text-primary">Client Case Study</p>
              <h1 className="font-display text-3xl font-bold text-white lg:text-4xl">{client.name}</h1>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
                {client.industry && (
                  <span className="font-medium uppercase tracking-wider text-zinc-300">{client.industry}</span>
                )}
                <span className="flex items-center gap-1.5 font-semibold text-primary">
                  <Briefcase className="h-4 w-4" aria-hidden="true" />
                  {totalProjects} project{totalProjects === 1 ? "" : "s"} delivered
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Projects (long-form case studies) ---------- */}
      <section className="py-14 lg:py-18" aria-label={`${client.name} projects`}>
        <div className="container-site space-y-8">
          {totalProjects === 0 ? (
            <p className="py-10 text-center text-sm text-zinc-500">
              Projects for {client.name} are being documented — check back soon.
            </p>
          ) : (
            client.projects.map((p, i) => (
              <article
                key={p.id}
                className="overflow-hidden rounded-2xl border bg-white shadow-sm"
                aria-label={p.title}
              >
                <div className="sm:grid sm:grid-cols-2">
                  {/* image — alternates left/right per project */}
                  <div
                    className={`relative aspect-[16/10] w-full overflow-hidden bg-zinc-100 sm:aspect-auto sm:min-h-[300px] ${
                      i % 2 === 1 ? "sm:order-2" : "sm:order-1"
                    }`}
                  >
                    <img
                      src={p.image}
                      alt={`${p.title} — ${client.name}`}
                      loading={i === 0 ? "eager" : "lazy"}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    {p.year && (
                      <Badge className="absolute left-3 top-3 bg-zinc-950/85 text-white hover:bg-zinc-950/85">
                        {p.year}
                      </Badge>
                    )}
                  </div>

                  {/* long description */}
                  <div className={`p-5 sm:p-8 ${i % 2 === 1 ? "sm:order-1" : "sm:order-2"}`}>
                    <p className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                      Project {i + 1} of {totalProjects}
                    </p>
                    <h2 className="mt-1.5 font-display text-xl font-bold text-zinc-900 sm:text-2xl">{p.title}</h2>
                    <div className="mt-4 space-y-3 border-t border-zinc-100 pt-4">
                      {splitParagraphs(p.description).map((para, j) => (
                        <p key={j} className="whitespace-pre-line text-[15px] leading-relaxed text-zinc-600">
                          {para}
                        </p>
                      ))}
                      <p className="pt-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        Designed, fabricated &amp; installed by {SITE.name}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}

          {/* CTA */}
          <div className="mt-2 flex flex-col items-center justify-between gap-4 rounded-2xl bg-zinc-950 p-6 text-center sm:flex-row sm:p-8 sm:text-left">
            <div>
              <p className="font-display text-lg font-bold text-white sm:text-xl">
                Want work like this for your business?
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                Free quote with a 3D design mockup — delivered within hours.
              </p>
            </div>
            <Button size="lg" className="shrink-0 rounded-full px-8 font-bold" onClick={() => navigate("/quote")}>
              Get a Free Quote
            </Button>
          </div>

          <div className="text-center">
            <Button variant="outline" className="rounded-full font-bold" onClick={() => navigate("/portfolio")}>
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" /> View Full Portfolio
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
