import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, Bandage, Leaf, Mic } from "lucide-react";
import { MicButton } from "@/components/MicButton";
import { CategoryCard } from "@/components/CategoryCard";
import { Disclaimer } from "@/components/Disclaimer";

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

export default function Index() {
  const [isListening, setIsListening] = useState(false);
  const navigate = useNavigate();

  const handleMicClick = () => {
    setIsListening((prev) => !prev);
    if (!isListening) {
      // Navigate to chat when starting voice
      setTimeout(() => navigate("/chat?voice=true"), 600);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-4 py-20 text-center">
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
      <section className="container px-4 pb-16" aria-labelledby="categories-heading">
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

      {/* Disclaimer */}
      <section className="container max-w-2xl px-4 pb-16">
        <Disclaimer />
      </section>
    </div>
  );
}
