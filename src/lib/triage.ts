export type TriageLevel = "emergency" | "urgent" | "routine";

const EMERGENCY_PATTERNS: RegExp[] = [
  /\bchest\s*pain(s)?\b/i,
  /\bheart\s*attack\b/i,
  /\bcardiac\s*arrest\b/i,
  /\b(can'?t|cannot|difficulty|trouble|hard\s+to)\s+breathe?\b/i,
  /\bshort(ness)?\s+of\s+breath\b/i,
  /\bchoking\b/i,
  /\b(unconscious|unresponsive|passed\s+out|fainted)\b/i,
  /\b(stroke|facial\s+drooping|slurred\s+speech)\b/i,
  /\b(severe|heavy|uncontroll?ed)\s+bleeding\b/i,
  /\banaphylaxis\b|\bsevere\s+allergic\b/i,
  /\bseizure\b|\bconvulsion(s)?\b/i,
  /\boverdose\b|\bpoisoning\b/i,
  /\bsuicide\b|\bkill\s+myself\b|\bself[-\s]?harm\b/i,
];

const URGENT_PATTERNS: RegExp[] = [
  /\bhigh\s+fever\b/i,
  /\bsevere\s+pain\b/i,
  /\bpersistent\s+vomit(ing)?\b/i,
  /\bdehydration\b/i,
  /\bbloody\s+(stool|vomit)\b/i,
  /\bnew\s+confusion\b/i,
  /\bworsening\b/i,
];

export function detectEmergency(text: string): boolean {
  return triageLevel(text) === "emergency";
}

export function triageLevel(text: string): TriageLevel {
  if (!text?.trim()) return "routine";
  if (EMERGENCY_PATTERNS.some((re) => re.test(text))) return "emergency";
  if (URGENT_PATTERNS.some((re) => re.test(text))) return "urgent";
  return "routine";
}
