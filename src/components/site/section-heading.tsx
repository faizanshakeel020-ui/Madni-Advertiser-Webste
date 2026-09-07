"use client";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  dark = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  dark?: boolean;
}) {
  return (
    <div className={`mb-8 sm:mb-10 ${align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}`}>
      {eyebrow && (
        <p className="mb-2 font-display text-xs font-bold uppercase tracking-[0.2em] text-primary">
          {eyebrow}
        </p>
      )}
      <h2 className={`font-display text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-4xl ${dark ? "text-white" : "text-zinc-900"}`}>
        {title}
      </h2>
      {description && (
        <p className={`mt-3 text-sm leading-relaxed sm:text-base ${dark ? "text-zinc-400" : "text-zinc-600"}`}>
          {description}
        </p>
      )}
    </div>
  );
}
