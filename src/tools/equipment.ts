import { tool } from "ai";
import { z } from "zod";

function normalize(item: string): string {
  return item.toLowerCase().trim();
}

function isOwned(required: string, owned: string[]): boolean {
  const req = normalize(required);
  return owned.some((item) => {
    const own = normalize(item);
    return own.includes(req) || req.includes(own);
  });
}

export const checkEquipment = tool({
  description:
    "Check whether the user has the equipment needed for a recipe or cooking method. " +
    "Pass the equipment the recipe/method requires, and the equipment the user has stated " +
    "they own so far in this conversation. Use this before suggesting anything that needs " +
    "specific equipment (an oven, a blender, an air fryer, etc.) — don't assume a standard kit.",
  inputSchema: z.object({
    required: z
      .array(z.string())
      .describe("Equipment items required by the recipe or method being considered"),
    owned: z
      .array(z.string())
      .describe("Equipment items the user has said they own, based on this conversation"),
  }),
  execute: async ({ required, owned }) => {
    const missing = required.filter((item) => !isOwned(item, owned));
    return {
      feasible: missing.length === 0,
      missing,
    };
  },
});
