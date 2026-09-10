import { z } from "zod";

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

export const statuses = ["nou", "in_lucru", "rezolvat", "respins"] as const;

export type Status = (typeof statuses)[number];

export const statusLabels: Record<Status, string> = {
  nou: "Nou",
  in_lucru: "În lucru",
  rezolvat: "Rezolvat",
  respins: "Respins",
};

export const statusColors: Record<Status, string> = {
  nou: "#e11d48",
  in_lucru: "#d97706",
  rezolvat: "#0d9488",
  respins: "#94a3b8",
};

export const reportInput = z.object({
  category: z.enum(categories),
  description: z.string().trim().max(1000).optional().default(""),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});
