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

/** Icon for a subcategory slug (falls back to a generic tag). */
export function subcategoryIcon(slug?: string | null): LucideIcon {
  return (slug && SUBCATEGORY_ICONS[slug]) || Tag;
}
