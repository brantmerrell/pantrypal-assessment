import { tool } from "ai";
import { z } from "zod";
import { getPreferences, savePreference } from "../db.js";
import { isHealthRelated } from "../guardrails/health.js";

export function buildPreferenceTools(deviceId: string) {
  return {
    savePreference: tool({
      description:
        "Save a non-health user preference for future conversations (e.g., a favorite cuisine, a disliked ingredient, 'vegetarian'). Never use this for medical or health conditions — those are never stored.",
      inputSchema: z.object({
        preference: z
          .string()
          .describe("A short, plain-language preference statement to remember"),
      }),
      execute: async ({ preference }) => {
        if (isHealthRelated(preference)) {
          return {
            saved: false,
            reason: "Health-related preferences are not stored, per policy.",
          };
        }
        savePreference(deviceId, preference);
        return { saved: true };
      },
    }),
    getPreferences: tool({
      description:
        "Retrieve this user's previously saved preferences, if any were saved in an earlier conversation.",
      inputSchema: z.object({}),
      execute: async () => {
        return { preferences: getPreferences(deviceId) };
      },
    }),
  };
}
