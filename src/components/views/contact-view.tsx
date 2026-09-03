"use client";

import { Clock, Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Youtube } from "lucide-react";
import { QuoteForm } from "@/components/site/quote-form";
import { WhatsAppIcon } from "@/components/site/icons";
import { SectionHeading } from "@/components/site/section-heading";
import { SITE, whatsappUrl } from "@/lib/constants";
import { useRoute } from "@/lib/router";
import { Button } from "@/components/ui/button";

export function ContactView() {
  const { navigate } = useRoute();
  return (
    <div>
      {/* Header */}
      <div className="bg-zinc-950 py-12 lg:py-16">
        <div className="container-site">
          <p className="mb-2 font-display text-xs font-bold uppercase tracking-[0.2em] text-primary">Contact</p>
          <h1 className="font-display text-3xl font-bold text-white lg:text-4xl">Let&apos;s Talk About Your Sign</h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-300 sm:text-base">
            Call, WhatsApp, email or visit the workshop — we reply fast, usually within minutes on
            WhatsApp.
          </p>
        </div>
      </div>

      <div className="container-site grid gap-10 py-10 lg:grid-cols-5 lg:py-14">
        {/* Contact info cards */}
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="font-display text-lg font-bold text-zinc-900">Contact Details</h3>
            <ul className="mt-5 space-y-4 text-sm">
              <li className="flex gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                  <Phone className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-bold text-zinc-900">Phone</p>
                  <a href={SITE.phoneHref} className="text-zinc-600 hover:text-primary">{SITE.phone}</a>
                </div>
              </li>
              <li className="flex gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <WhatsAppIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-bold text-zinc-900">WhatsApp</p>
                  <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-emerald-600">
                    Chat with us — fastest response
                  </a>
                </div>
              </li>
              <li className="flex gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                  <Mail className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-bold text-zinc-900">Email</p>
                  <a href={SITE.emailHref} className="text-zinc-600 hover:text-primary">{SITE.email}</a>
                </div>
              </li>
              <li className="flex gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                  <MapPin className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-bold text-zinc-900">Workshop & Office</p>
                  <p className="text-zinc-600">{SITE.address}</p>
                </div>
              </li>
              <li className="flex gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                  <Clock className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-bold text-zinc-900">Business Hours</p>
                  <p className="text-zinc-600">{SITE.hours} · Sunday closed</p>
                </div>
              </li>
            </ul>

            <div className="mt-5 flex gap-2 border-t pt-5">
              {[
                { href: SITE.social.facebook, icon: Facebook, label: "Facebook" },
                { href: SITE.social.instagram, icon: Instagram, label: "Instagram" },
                { href: SITE.social.linkedin, icon: Linkedin, label: "LinkedIn" },
                { href: SITE.social.youtube, icon: Youtube, label: "YouTube" },
              ].map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border text-zinc-600 transition-colors hover:border-primary hover:bg-accent hover:text-primary"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {/* Map */}
          <div className="overflow-hidden rounded-2xl border shadow-sm">
            <iframe
              title="Madni Advertiser location map — Ferozepur Road, Lahore"
              src="https://www.openstreetmap.org/export/embed.html?bbox=74.3182%2C31.5180%2C74.3682%2C31.5480&layer=mapnik&marker=31.5330%2C74.3432"
              className="h-64 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="flex items-center justify-between bg-zinc-50 px-4 py-3">
              <p className="flex items-center gap-2 text-xs text-zinc-600">
                <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                Ferozepur Road, Lahore
              </p>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Ferozepur+Road+Lahore+Pakistan"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-primary hover:underline"
              >
                Open in Google Maps →
              </a>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
            <SectionHeading
              eyebrow="Send a Message"
              title="How can we help?"
              description="Tell us about your project or question — we'll get back to you the same day."
              align="left"
            />
            <QuoteForm defaultService="General Inquiry" compact />
          </div>
          <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl bg-zinc-950 p-6 text-center sm:flex-row sm:text-left">
            <div>
              <p className="font-display text-lg font-bold text-white">Prefer to talk it through?</p>
              <p className="mt-1 text-sm text-zinc-400">Our consultants can visit your site in Lahore for free.</p>
            </div>
            <div className="flex gap-3">
              <a href={SITE.phoneHref}>
                <Button variant="outline" className="border-white/30 bg-transparent font-bold text-white hover:bg-white hover:text-zinc-900">
                  <Phone className="mr-2 h-4 w-4" aria-hidden="true" /> Call Now
                </Button>
              </a>
              <Button className="bg-emerald-500 font-bold text-white hover:bg-emerald-600" onClick={() => navigate("/quote")}>
                Get a Quote
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
