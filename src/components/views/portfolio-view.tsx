"use client";

import { useMemo } from "react";
import { ArrowUpRight, Briefcase, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeading } from "@/components/site/section-heading";
import { useRoute } from "@/lib/router";
import { useContent } from "@/lib/content";
import { MediaImg } from "@/components/site/media-img";
import type { ClientProject } from "@/lib/types";

function projectImages(project: ClientProject): string[] {
  return project.images.length ? project.images : ["/images/proj-building.png"];
}

export function PortfolioView() {
  const { route, navigate } = useRoute();
  const { clients: contentClients, portfolioCategories: PORTFOLIO_CATEGORIES, ready } = useContent();
  const filter = route.query.cat ?? "All";
  const clients = contentClients;
  const loadingClients = !ready;

  const projects = useMemo(() => {
    const clientProjects = clients.flatMap((client) =>
      client.projects.map((project) => ({ client, project }))
    );
    const category = filter === "All" ? null : filter;
    if (!category) {
      return clientProjects.map(({ client, project }) => ({
        client,
        project,
        category: project.portfolioCategories?.join(", ") || "Client Project",
      }));
    }

    const matched = clientProjects.flatMap(({ client, project }) => {
      const matchedCategory = project.portfolioCategories?.includes(category) ? category : null;
      return matchedCategory ? [{ client, project, category: matchedCategory }] : [];
    });

    return matched;
  }, [clients, filter]);

  const setFilter = (c: string) => {
    navigate(c === "All" ? "/portfolio" : `/portfolio?cat=${c}`, { replace: true });
  };

  return (
    <div>
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

        {loadingClients ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="aspect-[4/3] rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map(({ client, project, category }) => (
              <article key={`${client.id}-${project.id}-${category}`} className="overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-lg">
                <button
                  type="button"
                  onClick={() => client.slug && navigate(`/casestudy/portfolio/${client.slug}`)}
                  className="group relative block aspect-[4/3] w-full overflow-hidden bg-zinc-100 text-left"
                  aria-label={`View ${project.title} for ${client.name}`}
                >
                  <MediaImg src={projectImages(project)[0]} alt={project.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-transparent" aria-hidden="true" />
                  <Badge variant="secondary" className="absolute left-3 top-3 bg-white/90 text-zinc-800 hover:bg-white/90">{category}</Badge>
                  {project.images.length > 1 && (
                    <span className="absolute right-3 top-3 rounded-full bg-zinc-950/75 px-2.5 py-1 text-xs font-bold text-white">
                      {project.images.length} photos
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="font-display text-base font-bold text-white">{project.title}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-300">
                      <Briefcase className="h-3 w-3" aria-hidden="true" /> {client.name}
                    </p>
                  </div>
                </button>
                <div className="p-4">
                  <p className="line-clamp-3 text-sm leading-6 text-zinc-600">{project.description}</p>
                  <div className="mt-3 flex items-center justify-between gap-3 border-t pt-3 text-xs text-zinc-500">
                    {client.industry && <span className="truncate">{client.industry}</span>}
                    {project.year && <span>{project.year}</span>}
                    {client.slug && (
                      <button
                        type="button"
                        onClick={() => navigate(`/casestudy/portfolio/${client.slug}`)}
                        className="ml-auto inline-flex shrink-0 items-center gap-1 font-bold text-primary hover:underline"
                      >
                        Full project details <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loadingClients && projects.length === 0 && (
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
