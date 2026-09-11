import { z } from "zod";
import {
  CircleQuestionMark,
  Construction,
  LightbulbOff,
  TrafficCone,
  Trash,
  TreeDeciduous,
  type IconNode,
} from "lucide";

export const categories = [
  "groapa",
  "iluminat",
  "gunoi",
  "drum",
  "spatiu_verde",
  "altul",
] as const;

export type Category = (typeof categories)[number];

export const categoryLabels: Record<Category, string> = {
  groapa: "Groapă în drum",
  iluminat: "Iluminat stricat",
  gunoi: "Gunoi",
  drum: "Drum deteriorat",
  spatiu_verde: "Spațiu verde",
  altul: "Altceva",
};

export const categoryIcons: Record<Category, IconNode> = {
  groapa: TrafficCone,
  iluminat: LightbulbOff,
  gunoi: Trash,
  drum: Construction,
  spatiu_verde: TreeDeciduous,
  altul: CircleQuestionMark,
};

export const statuses = ["nou", "in_lucru", "rezolvat", "respins"] as const;

export type Status = (typeof statuses)[number];

export const statusLabels: Record<Status, string> = {
  nou: "Nou",
  in_lucru: "În lucru",
  rezolvat: "Rezolvat",
  respins: "Respins",
};

export const statusColors: Record<Status, string> = {
  nou: "#ef4444",
  in_lucru: "#f59e0b",
  rezolvat: "#14b8a6",
  respins: "#64748b",
};

// Darker shade of each status color, for text on a light tint of it.
export const statusInk: Record<Status, string> = {
  nou: "#b91c1c",
  in_lucru: "#b45309",
  rezolvat: "#0f766e",
  respins: "#475569",
};

export const reportInput = z.object({
  category: z.enum(categories),
  description: z.string().trim().max(1000).optional().default(""),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export const statusInput = z.object({
  status: z.enum(statuses),
});
