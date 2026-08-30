const ALLERGEN_NOTICE =
  "\n\n---\n⚠️ Allergen notice: this response may reference ingredients that are allergens. " +
  "Please verify ingredient safety yourself before preparing or eating anything suggested here.";

export function appendAllergenNotice(reply: string): string {
  return reply + ALLERGEN_NOTICE;
}
