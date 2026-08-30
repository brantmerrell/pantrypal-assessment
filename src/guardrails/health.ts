const HEALTH_KEYWORDS = [
  "diabet",
  "allerg",
  "pregnan",
  "diagnos",
  "medication",
  "disease",
  "cancer",
  "surgery",
  "condition",
  "disorder",
  "prescri",
  "therap",
];

export function isHealthRelated(text: string): boolean {
  const lower = text.toLowerCase();
  return HEALTH_KEYWORDS.some((kw) => lower.includes(kw));
}
