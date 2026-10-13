// Shared request sanitization helpers. Kept pure so they can be tested with Deno.
export const MAX_MESSAGES = 50;
export const MAX_TEXT_LEN = 4000;
export const MAX_TOTAL_TEXT_LEN = 16000;
export const MAX_PROFILE_LEN = 800;
export const MAX_IMAGE_PARTS = 4;
export const MAX_IMAGE_URL_LEN = 2_000_000;
export const MAX_REQUEST_BYTES = 9_000_000;

type SanitizationBudget = { textUsed: number; imagesUsed: number };

export function sanitizeContent(content: unknown, budget: SanitizationBudget): string | any[] | null {
  if (typeof content === "string") {
    const remaining = Math.max(0, MAX_TOTAL_TEXT_LEN - budget.textUsed);
    const text = content.slice(0, Math.min(MAX_TEXT_LEN, remaining));
    budget.textUsed += text.length;
    return text;
  }

  if (Array.isArray(content)) {
    const parts: any[] = [];
    for (const p of content) {
      if (!p || typeof p !== "object") continue;
      if (p.type === "text" && typeof p.text === "string") {
        const remaining = Math.max(0, MAX_TOTAL_TEXT_LEN - budget.textUsed);
        if (remaining <= 0) continue;
        const text = p.text.slice(0, Math.min(MAX_TEXT_LEN, remaining));
        budget.textUsed += text.length;
        if (text) parts.push({ type: "text", text });
      } else if (p.type === "image_url" && budget.imagesUsed < MAX_IMAGE_PARTS) {
        const url = typeof p.image_url === "string" ? p.image_url : p.image_url?.url;
        if (
          typeof url === "string" &&
          (url.startsWith("data:image/") || url.startsWith("https://")) &&
          url.length <= MAX_IMAGE_URL_LEN
        ) {
          parts.push({ type: "image_url", image_url: { url } });
          budget.imagesUsed++;
        }
      }
    }
    return parts.length ? parts : null;
  }

  return null;
}

export function sanitizeMessages(input: unknown): any[] {
  if (!Array.isArray(input)) return [];
  const budget: SanitizationBudget = { textUsed: 0, imagesUsed: 0 };
  const out: any[] = [];

  for (const m of input.slice(-MAX_MESSAGES)) {
    if (!m || typeof m !== "object") continue;
    const role = (m as any).role;
    if (role !== "user" && role !== "assistant") continue;
    const content = sanitizeContent((m as any).content, budget);
    if (content === null || (typeof content === "string" && !content.trim())) continue;
    out.push({ role, content });
    if (budget.textUsed >= MAX_TOTAL_TEXT_LEN && budget.imagesUsed >= MAX_IMAGE_PARTS) break;
  }
  return out;
}
