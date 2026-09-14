import { Facebook, Globe2, Instagram, Linkedin, Music2, Twitter, Youtube } from "lucide-react";

export function SocialIcon({ platform, className }: { platform: string; className?: string }) {
  const name = platform.toLowerCase();
  const Icon = name.includes("facebook") ? Facebook
    : name.includes("instagram") ? Instagram
    : name.includes("youtube") ? Youtube
    : name.includes("linkedin") ? Linkedin
    : name.includes("tiktok") ? Music2
    : name === "x" || name.includes("twitter") ? Twitter
    : Globe2;
  return <Icon className={className} aria-hidden="true" />;
}
