import { tool } from "ai";
import { z } from "zod";

export const webSearch = tool({
  description:
    "Search the web for current information — useful for things not in general knowledge, like a specific restaurant, a product, or a recent event.",
  inputSchema: z.object({
    query: z.string().describe("The search query"),
  }),
  execute: async ({ query }) => {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      return { error: "TAVILY_API_KEY is not configured" };
    }

    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: 5,
      }),
    });

    if (!res.ok) {
      return { error: `Tavily search failed: ${res.status}` };
    }

    const data = (await res.json()) as {
      results: { title: string; url: string; content: string }[];
    };

    return {
      results: data.results.map((r) => ({
        title: r.title,
        url: r.url,
        snippet: r.content,
      })),
    };
  },
});
