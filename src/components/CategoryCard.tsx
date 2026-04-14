import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";

interface CategoryCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: "triage" | "firstaid" | "wellness";
  onClick: () => void;
}

const colorMap = {
  triage: "bg-triage text-triage-foreground",
  firstaid: "bg-firstaid text-firstaid-foreground",
  wellness: "bg-wellness text-wellness-foreground",
};

const iconBgMap = {
  triage: "bg-triage/15 text-triage",
  firstaid: "bg-firstaid/15 text-firstaid",
  wellness: "bg-wellness/15 text-wellness",
};

export function CategoryCard({ title, description, icon: Icon, color, onClick }: CategoryCardProps) {
  return (
    <motion.button
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group flex flex-col items-start gap-4 rounded-xl border border-border bg-card p-6 text-left shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-ring w-full"
      aria-label={`${title}: ${description}`}
    >
      <div className={`rounded-lg p-3 ${iconBgMap[color]}`}>
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <div>
        <h3 className="font-display text-lg font-bold text-card-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
      <span className={`mt-auto inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${colorMap[color]}`}>
        Get started →
      </span>
    </motion.button>
  );
}
