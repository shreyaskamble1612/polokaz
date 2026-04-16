import { z } from "zod";

export const referralCreateSchema = z.object({
  expiresAt: z.number({ error: "Expires at haves to be a number" }),
  maxUses: z.optional(
    z.number({ error: "Max uses haves to be a number" }).min(1),
  ),
});
