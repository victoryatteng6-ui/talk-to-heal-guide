export interface HealthProfile {
// Privacy helper: removes the locally stored health profile.
export function clearProfile() {
  if (typeof window !== "undefined") localStorage.removeItem(KEY);
}

  age?: string;
  sex?: string;
  allergies?: string;
  medications?: string;
  conditions?: string;
}

const KEY = "healthvoice.profile.v1";

export function loadProfile(): HealthProfile {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveProfile(p: HealthProfile) {
  localStorage.setItem(KEY, JSON.stringify(p));
}

export function profileToContext(p: HealthProfile): string | null {
  const lines: string[] = [];
  if (p.age) lines.push(`Age: ${p.age}`);
  if (p.sex) lines.push(`Sex: ${p.sex}`);
  if (p.allergies?.trim()) lines.push(`Known allergies: ${p.allergies.trim()}`);
  if (p.medications?.trim()) lines.push(`Current medications: ${p.medications.trim()}`);
  if (p.conditions?.trim()) lines.push(`Existing conditions: ${p.conditions.trim()}`);
  if (!lines.length) return null;
  return `## USER HEALTH PROFILE (use to personalize advice; flag drug/allergy interactions)\n${lines.join("\n")}`;
}
