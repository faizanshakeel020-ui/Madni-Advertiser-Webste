"use client";

/**
 * <img> that renders a neutral placeholder when src is missing
 * (admin-added services / sub-services may skip images).
 */
export function MediaImg({
  src,
  alt,
  className,
  loading = "lazy",
}: {
  src?: string | null;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}) {
  if (!src) {
    return (
      <span
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center bg-zinc-100 text-zinc-300 ${className ?? ""}`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-1/3 w-1/3 max-h-10 max-w-10"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
      </span>
    );
  }
  return <img src={src} alt={alt} className={className} loading={loading} />;
}
