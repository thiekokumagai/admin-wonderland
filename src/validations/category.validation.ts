import { z } from "zod";

export const categorySchema = z.object({
  nome: z
    .string()
    .min(1, "Nome é obrigatório")
    .max(50, "Nome muito grande"),

  file: z
    .any()
    .nullable()
    .optional(),
});

export type CategoryFormData = z.infer<typeof categorySchema>;