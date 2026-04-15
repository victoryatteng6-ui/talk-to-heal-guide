import { AlertTriangle } from "lucide-react";

interface DisclaimerProps {
  variant?: "default" | "fixed";
}

export function Disclaimer({ variant = "default" }: DisclaimerProps) {
  return (
    <div
      className="flex items-start gap-3 rounded-lg border px-4 py-3 bg-[hsl(var(--disclaimer))] border-[hsl(var(--disclaimer-border))]"
      role="alert"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[hsl(var(--disclaimer-foreground))]" aria-hidden="true" />
      <p className="text-sm leading-relaxed text-[hsl(var(--disclaimer-foreground))]">
        <strong className="font-semibold">Medical Disclaimer:</strong> This is not medical advice. Always consult a qualified healthcare professional for diagnosis and treatment.
      </p>
    </div>
  );
}
