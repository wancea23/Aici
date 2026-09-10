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

export const reportInput = z.object({
  category: z.enum(categories),
  description: z.string().trim().max(1000).optional().default(""),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});
