import { AlertTriangle } from "lucide-react";

export function Disclaimer() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-4" role="alert">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
      <p className="text-sm text-muted-foreground leading-relaxed">
        <strong className="text-foreground">Disclaimer:</strong> I'm not a doctor. For medical advice, please consult a healthcare professional.
      </p>
    </div>
  );
}
