import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bump } from "@/lib/stats";

// Placeholder WhatsApp Business number — replace with your real one later.
// Format: international, digits only, no '+'.
const WA_NUMBER = "2348000000000";

interface Props {
  message?: string;
  className?: string;
  variant?: "default" | "outline" | "secondary";
  label?: string;
}

export function ConsultSpecialistButton({
  message = "Hello, I'd like to consult a specialist via Talk To Heal.",
  className,
  variant = "default",
  label = "Consult a Specialist",
}: Props) {
  const handleClick = () => {
    bump("labBookings", 1); // tracked as outbound lead in admin dashboard
    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      className={className}
      aria-label="Consult a specialist on WhatsApp"
    >
      <MessageCircle className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}
