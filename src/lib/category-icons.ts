/**
 * Visual identity map for shop subcategories — a Lucide icon per subcategory
 * slug, shown before the label in the Shop mega menu / mobile drawer.
 */
import {
  Lightbulb,
  Table,
  Frame,
  Sun,
  AppWindow,
  Gem,
  Zap,
  Type,
  Building2,
  DoorOpen,
  Sticker,
  Signpost,
  MonitorPlay,
  BookOpen,
  Image as ImageIcon,
  Layers,
  RectangleHorizontal,
  Flag,
  PartyPopper,
  Moon,
  Heart,
  Quote,
  Tag,
  type LucideIcon,
} from "lucide-react";

export const SUBCATEGORY_ICONS: Record<string, LucideIcon> = {
  // Acrylic & Name Plates
  "led-name-plates": Lightbulb,
  "desk-name-plates": Table,
  "wall-name-signs": Frame,
  // LED Signs
  "backlit-panels": Sun,
  "window-signs": AppWindow,
  // 3D Letters
  "chrome-letters": Gem,
  "mini-led-letters": Zap,
  "steel-letters": Type,
  // Office Signage
  "reception-signs": Building2,
  "door-signs": DoorOpen,
  "glass-decals": Sticker,
  wayfinding: Signpost,
  // Digital Signage
  "video-walls": MonitorPlay,
  "menu-boards": BookOpen,
  "poster-displays": ImageIcon,
  // Retail Signage
  "snap-frames": Frame,
  "acp-boards": Layers,
  "flex-boards": RectangleHorizontal,
  // Banners
  "vinyl-banners": Flag,
  "event-banners": PartyPopper,
  // Neon Art
  "calligraphy-neon": Moon,
  "name-neon": Heart,
  "quote-neon": Quote,
};

export const SUBCATEGORY_IMAGES: Record<string, string> = {
  "led-name-plates": "/images/p-acrylic-led-nameplate-2.png",
  "desk-name-plates": "/images/p-acrylic-office.png",
  "wall-name-signs": "/images/p-acrylic-home.png",
  "backlit-panels": "/images/p-led-backlit-2.png",
  "window-signs": "/images/p-led-open.png",
  "chrome-letters": "/images/p-3d-letters.png",
  "mini-led-letters": "/images/p-3d-mini.png",
  "steel-letters": "/images/p-steel-letters.png",
  "reception-signs": "/images/p-acrylic-office.png",
  "door-signs": "/images/p-door-metal.png",
  "glass-decals": "/images/p-door-glass.png",
  wayfinding: "/images/p-wayfinding.png",
  "video-walls": "/images/p-videowall.png",
  "menu-boards": "/images/p-menuboard.png",
  "poster-displays": "/images/p-digital-poster.png",
  "snap-frames": "/images/p-lightbox.png",
  "acp-boards": "/images/p-acp.png",
  "flex-boards": "/images/p-shop-flex.png",
  "vinyl-banners": "/images/p-banner-vinyl.png",
  "event-banners": "/images/p-banner-birthday.png",
  "calligraphy-neon": "/images/p-neon-bismillah-2.png",
  "name-neon": "/images/p-neon-couple.png",
  "quote-neon": "/images/p-neon-gym.png",
};

/** Image for a subcategory, with a catalog image as the fallback. */
export function subcategoryImage(slug?: string | null): string {
  return (slug && SUBCATEGORY_IMAGES[slug]) || "/images/p-acrylic-led-nameplate.png";
}

/** Icon for a subcategory slug (falls back to a generic tag). */
export function subcategoryIcon(slug?: string | null): LucideIcon {
  return (slug && SUBCATEGORY_ICONS[slug]) || Tag;
}
