import { z } from "zod";

export const suspectSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email().optional(),
  name: z.string().optional(),
});

export const reportSchema = z.object({
  type: z.string().min(2, "Choisir un type"),
  description: z.string().min(10, "Décris l’arnaque"),
  amount: z.coerce.number().optional(),
  currency: z.string().optional(),
  suspect: suspectSchema.optional(),
  evidenceIds: z.array(z.string()).default([]),
});
