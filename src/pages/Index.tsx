import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, Bandage, Leaf, Mic, Shield, Thermometer, HeartPulse, Droplets, FlaskConical, Crown } from "lucide-react";
import { MicButton } from "@/components/MicButton";
import { CategoryCard } from "@/components/CategoryCard";
import { Disclaimer } from "@/components/Disclaimer";
import { ShareReportButton } from "@/components/ShareReportButton";

const categories = [
  {
    title: "Triage",
    description: "Assess your symptoms and get guidance on urgency levels.",
    icon: Activity,
    color: "triage" as const,
  },
  {
    title: "First Aid",
    description: "Step-by-step procedures for common injuries and emergencies.",
    icon: Bandage,
    color: "firstaid" as const,
  },
  {
    title: "Wellness",
    description: "Tips on nutrition, exercise, mental health & preventive care.",
    icon: Leaf,
    color: "wellness" as const,
  },
];

const localConcerns = [
  {
    icon: Shield,
    title: "Malaria Prevention",
    tips: [
      "Sleep under insecticide-treated mosquito nets",
      "Use mosquito repellent on exposed skin",
      "Remove standing water around your home",
      "Wear long sleeves in the evening",
      "Seek testing if you have fever with chills",
    ],
  },
  {
    icon: HeartPulse,
    title: "Hypertension Tips",
    tips: [
      "Reduce salt intake — use herbs for seasoning",
      "Exercise at least 30 minutes daily",
      "Monitor your blood pressure regularly",
      "Limit alcohol and avoid smoking",
      "Follow the DASH diet (fruits, vegetables, whole grains)",
    ],
  },
  {
    icon: Thermometer,
    title: "Fever & Body Hotness",
    tips: [
      "'Body hotness' is often a sign of fever",
      "Stay hydrated — drink plenty of fluids",
      "Use a damp cloth on the forehead to cool down",
      "Take paracetamol as directed for relief",
      "See a doctor if fever persists beyond 3 days",
    ],
  },
];

export default function Index() {
  const [isListening, setIsListening] = useState(false);
  const navigate = useNavigate();

  const handleMicClick = () => {
    setIsListening((prev) => !prev);
    if (!isListening) {
      setTimeout(() => navigate("/chat?voice=true"), 600);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Disclaimer at top */}
      <section className="container max-w-3xl px-4 pt-6">
        <Disclaimer />
      </section>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-6"
        >
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Your Voice-Enabled
            <br />
            <span className="text-primary">Health Assistant</span>
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground leading-relaxed">
            Tap the microphone to ask about symptoms, first aid, or wellness tips.
            Get instant, helpful guidance — hands-free.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-10"
        >
          <MicButton isListening={isListening} onClick={handleMicClick} />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"
        >
          <Mic className="h-4 w-4" aria-hidden="true" />
          {isListening ? "Listening… speak now" : "Tap to start voice input"}
        </motion.p>
      </section>

      {/* Categories */}
      <section className="container px-4 pb-12" aria-labelledby="categories-heading">
        <h2 id="categories-heading" className="mb-8 text-center font-display text-2xl font-bold text-foreground">
          How can I help you today?
        </h2>
        <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-3">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <CategoryCard
                {...cat}
                onClick={() => navigate(`/chat?category=${cat.title.toLowerCase()}`)}
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Common Local Concerns */}
      <section className="container px-4 pb-16" aria-labelledby="local-concerns-heading">
        <h2 id="local-concerns-heading" className="mb-8 text-center font-display text-2xl font-bold text-foreground">
          Common Local Health Concerns
        </h2>
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-3">
          {localConcerns.map((concern, i) => {
            const Icon = concern.icon;
            return (
              <motion.div
                key={concern.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {concern.title}
                  </h3>
                </div>
                <ul className="space-y-2">
                  {concern.tips.map((tip, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Tools & Growth */}
      <section className="container px-4 pb-16" aria-labelledby="tools-h">
        <h2 id="tools-h" className="mb-8 text-center font-display text-2xl font-bold text-foreground">
          Tools & Services
        </h2>
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-3">
          {[
            { icon: Droplets, title: "Water Tracker", desc: "Log water, earn Health Points, build streaks.", to: "/wellness" },
            { icon: FlaskConical, title: "Find Nearby Labs", desc: "Book Malaria, Typhoid & more across Nigeria.", to: "/labs" },
            { icon: Crown, title: "Premium Report", desc: "Detailed PDF you can share with your doctor.", to: "/wellness" },
          ].map((t, i) => {
            const Icon = t.icon;
            return (
              <motion.button
                key={t.title}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }}
                onClick={() => navigate(t.to)}
                className="text-left rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow hover:border-primary/40"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-4">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">{t.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
              </motion.button>
            );
          })}
        </div>
        <div className="mt-8 flex justify-center">
          <ShareReportButton />
        </div>
      </section>
    </div>
  );
}
