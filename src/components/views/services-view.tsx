"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/site/section-heading";
import { QuoteForm } from "@/components/site/quote-form";
import { useRoute } from "@/lib/router";
import { useContent } from "@/lib/content";
import { MediaImg } from "@/components/site/media-img";
import { Badge } from "@/components/ui/badge";

/* ---------- Services overview page (#/services) ---------- */
export function ServicesIndexView() {
  const { navigate } = useRoute();
  const { services: SERVICES } = useContent();
  return (
    <div>
      <div className="container-site py-14 lg:py-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <button
              key={s.slug}
              onClick={() => navigate(`/services/${s.slug}`)}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition-all hover:border-primary/30 hover:shadow-lg"
            >
              <div className="aspect-[16/9] overflow-hidden bg-zinc-100">
                { }
                <MediaImg src={s.hero} alt={s.name} className="h-full w-full object-cover img-zoom" />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-display text-lg font-bold text-zinc-900 group-hover:text-primary">{s.name}</h3>
                <p className="mt-0.5 text-xs font-bold uppercase tracking-wider text-primary">{s.tagline}</p>
                <p className="mt-2.5 line-clamp-3 text-sm text-zinc-600">{s.description}</p>
                <ul className="mt-4 space-y-1.5">
                  {s.subServices.slice(0, 4).map((sub) => (
                    <li key={sub.name} className="flex items-center gap-2 text-sm text-zinc-600">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      {sub.name}
                    </li>
                  ))}
                </ul>
                <span className="mt-auto pt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary">
                  Explore Service <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Single service category page (#/services/:slug) ---------- */
export function ServiceCategoryView({ slug }: { slug: string }) {
  const { navigate } = useRoute();
  const { services, clients } = useContent();
  const service = services.find((s) => s.slug === slug);

  if (!service) {
    return (
      <div className="container-site flex flex-col items-center py-24 text-center">
        <h1 className="font-display text-2xl font-bold text-zinc-900">Service not found</h1>
        <Button className="mt-6 font-bold" onClick={() => navigate("/services")}>
          View All Services
        </Button>
      </div>
    );
  }

  const projects = clients
    .flatMap((client) => client.projects
      .filter((project) => (project.portfolioCategories ?? []).some((category) => service.projectTags.includes(category)))
      .map((project) => ({ client, project })))
    .slice(0, 4);

  return (
    <div>
      {/* Hero banner */}
      <section className="relative overflow-hidden bg-zinc-950 py-14 lg:py-20">
        { }
        {service.hero ? (
          <img src={service.hero} alt={`${service.name} by Madni Advertiser`} className="absolute inset-0 h-full w-full object-cover opacity-35" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/70 to-transparent" aria-hidden="true" />
        <div className="container-site relative">
          <nav className="mb-4 text-sm text-zinc-400" aria-label="Breadcrumb">
            <button onClick={() => navigate("/")} className="hover:text-primary">Home</button>
            <span className="mx-2">/</span>
            <button onClick={() => navigate("/services")} className="hover:text-primary">Services</button>
            <span className="mx-2">/</span>
            <span className="text-white">{service.name}</span>
          </nav>
          <Badge className="mb-3 bg-primary text-primary-foreground hover:bg-primary">{service.tagline}</Badge>
          <h1 className="font-display text-3xl font-bold text-white lg:text-5xl">{service.name}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-base">{service.description}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="rounded-full px-7 font-bold" onClick={() => navigate("/quote")}>
              Get a Free Quote <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-white/40 bg-white/10 px-7 font-bold text-white backdrop-blur hover:bg-white hover:text-zinc-900"
              onClick={() => navigate("/portfolio")}
            >
              See Our Work
            </Button>
          </div>
        </div>
      </section>

      {/* Sub-services */}
      <section className="py-14 lg:py-18">
        <div className="container-site">
          <SectionHeading
            eyebrow="What's Included"
            title={`${service.name} Solutions`}
            align="left"
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {service.subServices.map((sub) => (
              <div key={sub.name} className="group overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-lg">
                <div className="aspect-[16/10] overflow-hidden bg-zinc-100">
                  { }
                  <MediaImg src={sub.image} alt={sub.name} className="h-full w-full object-cover img-zoom" />
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg font-bold text-zinc-900">{sub.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">{sub.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Example projects */}
      {projects.length > 0 && (
        <section className="bg-zinc-50 py-14 lg:py-18">
          <div className="container-site">
            <SectionHeading eyebrow="Our Work" title="Example Projects" align="left" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {projects.map(({ client, project }) => (
                <button
                  key={project.id}
                  onClick={() => navigate(`/casestudy/portfolio/${client.slug}`)}
                  className="group relative overflow-hidden rounded-xl text-left"
                  aria-label={`View project: ${project.title}`}
                >
                  <div className="aspect-[4/3] overflow-hidden bg-zinc-100">
                    <MediaImg src={project.images[0] ?? "/images/proj-building.png"} alt={project.title} className="h-full w-full object-cover img-zoom" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" aria-hidden="true" />
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    {project.portfolioCategories?.[0] && <Badge variant="secondary" className="bg-white/90 text-zinc-800 hover:bg-white/90">{project.portfolioCategories[0]}</Badge>}
                    <p className="mt-1.5 line-clamp-1 font-display text-sm font-bold text-white">{project.title}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Process */}
      <section className="py-14">
        <div className="container-site">
          <SectionHeading eyebrow="How It Works" title="From Idea to Installation" />
          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: "01", title: "Consult", text: "Share your idea, space and budget — on call, WhatsApp or a site visit." },
              { step: "02", title: "Design", text: "Free 3D mockup of your sign on your actual location, revised until you love it." },
              { step: "03", title: "Fabricate", text: "Built in our workshop with premium LEDs and materials, quality checked twice." },
              { step: "04", title: "Install", text: "Professional installation with safety rigging, wiring and after-sales support." },
            ].map((p) => (
              <li key={p.step} className="relative rounded-2xl border bg-white p-5">
                <span className="font-display text-4xl font-bold text-primary/20">{p.step}</span>
                <h3 className="mt-1 font-display text-lg font-bold text-zinc-900">{p.title}</h3>
                <p className="mt-1.5 text-sm text-zinc-600">{p.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Embedded quote form */}
      <section className="bg-zinc-50 py-14 lg:py-18" id="quote">
        <div className="container-site grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <p className="mb-2 font-display text-xs font-bold uppercase tracking-[0.2em] text-primary">Free Quote</p>
            <h2 className="font-display text-2xl font-bold text-zinc-900 sm:text-3xl">
              Start your {service.shortName.toLowerCase()} project today
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              Tell us about your requirement and our team will respond with pricing, timeline and a
              free design mockup — usually within a few hours.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Free 3D design mockup with every quote",
                "Premium LED chips with warranty",
                "Installation available in all major cities",
                "After-sales service & maintenance",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-sm text-zinc-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-3">
            <QuoteForm defaultService={service.name} title={`Get a Quote — ${service.name}`} />
          </div>
        </div>
      </section>
    </div>
  );
}
