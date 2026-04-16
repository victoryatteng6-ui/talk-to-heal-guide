// Rule-based emergency keyword detector. Runs client-side BEFORE the AI replies
// so the SOS button appears instantly.
const EMERGENCY_PATTERNS: RegExp[] = [
  /\bchest\s*pain(s)?\b/i,
  /\bheart\s*attack\b/i,
  /\bcardiac\s*arrest\b/i,
  /\b(can'?t|cannot|difficulty|trouble|hard\s+to)\s+breathe?\b/i,
  /\bshort(ness)?\s+of\s+breath\b/i,
  /\bchoking\b/i,
  /\bunconscious\b|\bunresponsive\b|\bpassed\s+out\b|\bfainted\b/i,
  /\bstroke\b|\bfacial\s+drooping\b|\bslurred\s+speech\b/i,
  /\bsevere\s+bleeding\b|\bheavy\s+bleeding\b|\buncontrol(led|lable)\s+bleeding\b/i,
  /\banaphylaxis\b|\bsevere\s+allergic\b/i,
  /\bseizure\b|\bconvulsion(s)?\b/i,
  /\boverdose\b|\bpoisoning\b/i,
  /\bsuicide\b|\bkill\s+myself\b|\bself[-\s]?harm\b/i,
];

export function detectEmergency(text: string): boolean {
  if (!text) return false;
  return EMERGENCY_PATTERNS.some((re) => re.test(text));
}
