import {
  VolumeX,
  Moon,
  Lightbulb,
  Monitor,
  MonitorCheck,
  ArrowUpDown,
  Sun,
  Headphones,
  Armchair,
  Coffee,
  Accessibility,
  Shield,
  Flame,
  Snowflake,
  type LucideIcon,
} from "lucide-react";

export type AmenityId =
  | "low-noise"
  | "dark-surface"
  | "soft-lighting"
  | "dual-monitor"
  | "triple-monitor"
  | "standing-desk"
  | "near-window"
  | "quiet-pod"
  | "ergonomic-chair"
  | "near-amenities"
  | "wheelchair-accessible"
  | "privacy-screen"
  | "warm-area"
  | "cool-area";

export type Amenity = {
  id: AmenityId;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const AMENITIES: Amenity[] = [
  {
    id: "low-noise",
    label: "Low noise",
    description: "Quieter part of the floor, away from collaboration zones.",
    icon: VolumeX,
  },
  {
    id: "dark-surface",
    label: "Dark surface",
    description: "Matte, non-reflective desk surface — easier on the eyes.",
    icon: Moon,
  },
  {
    id: "soft-lighting",
    label: "Soft lighting",
    description: "Indirect or dimmed overhead lighting in this zone.",
    icon: Lightbulb,
  },
  {
    id: "dual-monitor",
    label: "Dual monitor",
    description: "Two displays already mounted at this desk.",
    icon: Monitor,
  },
  {
    id: "triple-monitor",
    label: "Triple monitor",
    description: "Three displays for heavy multi-context work.",
    icon: MonitorCheck,
  },
  {
    id: "standing-desk",
    label: "Standing desk",
    description: "Sit-stand desk with electric adjustment.",
    icon: ArrowUpDown,
  },
  {
    id: "near-window",
    label: "Near window",
    description: "Natural light, view of outside.",
    icon: Sun,
  },
  {
    id: "quiet-pod",
    label: "Quiet pod",
    description: "Enclosed pod for focused work or sensitive calls.",
    icon: Headphones,
  },
  {
    id: "ergonomic-chair",
    label: "Ergonomic chair",
    description: "Adjustable lumbar, armrests, and seat depth.",
    icon: Armchair,
  },
  {
    id: "near-amenities",
    label: "Near amenities",
    description: "Close to kitchen, toilets, or quiet rooms.",
    icon: Coffee,
  },
  {
    id: "wheelchair-accessible",
    label: "Wheelchair accessible",
    description: "Step-free, height-adjustable, accessible route.",
    icon: Accessibility,
  },
  {
    id: "privacy-screen",
    label: "Privacy screen",
    description: "Side panels or screen filter for sensitive work.",
    icon: Shield,
  },
  {
    id: "warm-area",
    label: "Warm area",
    description: "Toward the warmer side of the floor.",
    icon: Flame,
  },
  {
    id: "cool-area",
    label: "Cool area",
    description: "Toward the cooler side of the floor.",
    icon: Snowflake,
  },
];

export const AMENITY_BY_ID = Object.fromEntries(
  AMENITIES.map((a) => [a.id, a]),
) as Record<AmenityId, Amenity>;
