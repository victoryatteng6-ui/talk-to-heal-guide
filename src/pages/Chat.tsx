import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { ChatBubble } from "@/components/ChatBubble";
import { MicButton } from "@/components/MicButton";
import { Disclaimer } from "@/components/Disclaimer";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const categoryGreetings: Record<string, string> = {
  triage: "I can help assess your symptoms. Please describe what you're experiencing, and I'll guide you on urgency.",
  firstaid: "I can walk you through first aid procedures. What happened? Describe the injury or emergency.",
  wellness: "Let's talk about your wellness! Ask me about nutrition, exercise, mental health, or preventive care.",
};

export default function Chat() {
  const [searchParams] = useSearchParams();
  const category = searchParams.get("category");
  const voiceMode = searchParams.get("voice") === "true";

  const [messages, setMessages] = useState<Message[]>(() => {
    const greeting = category && categoryGreetings[category]
      ? categoryGreetings[category]
      : "Hello! I'm your health assistant. Ask me about symptoms, first aid, or wellness tips. How can I help?";
    return [{ id: "1", role: "assistant", content: greeting }];
  });

  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(voiceMode);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Simulated bot response
    setTimeout(() => {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getSimulatedResponse(trimmed, category),
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      {/* Chat messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="container mx-auto max-w-2xl space-y-4">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} role={msg.role} content={msg.content} />
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="container max-w-2xl px-4 pb-2">
        <Disclaimer />
      </div>

      {/* Input bar */}
      <div className="border-t border-border bg-card/80 backdrop-blur-md px-4 py-3">
        <div className="container mx-auto flex max-w-2xl items-center gap-3">
          <MicButton
            isListening={isListening}
            onClick={() => setIsListening((p) => !p)}
            size="sm"
          />
          <div className="flex flex-1 items-center rounded-xl border border-input bg-background px-4 py-2 focus-within:ring-2 focus-within:ring-ring">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question…"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              aria-label="Type your health question"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="ml-2 rounded-lg p-2 text-primary transition-colors hover:bg-primary/10 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Send message"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getSimulatedResponse(input: string, category: string | null): string {
  const lower = input.toLowerCase();
  if (lower.includes("headache") || lower.includes("head")) {
    return "Headaches can have many causes. Try resting in a dark, quiet room, stay hydrated, and consider over-the-counter pain relievers. If headaches are severe, sudden, or persistent, please see a healthcare professional.";
  }
  if (lower.includes("cut") || lower.includes("bleed")) {
    return "For minor cuts: Clean the wound with water, apply gentle pressure with a clean cloth to stop bleeding, then cover with a sterile bandage. Seek medical help if bleeding doesn't stop or the wound is deep.";
  }
  if (lower.includes("exercise") || lower.includes("fitness")) {
    return "Adults should aim for at least 150 minutes of moderate aerobic activity per week. Start slowly if you're new to exercise, and always warm up before workouts. Walking, swimming, and cycling are great starting points!";
  }
  if (lower.includes("stress") || lower.includes("anxiety") || lower.includes("mental")) {
    return "Managing stress is important for overall health. Try deep breathing exercises, regular physical activity, adequate sleep, and mindfulness meditation. Don't hesitate to reach out to a mental health professional for support.";
  }
  if (category === "triage") {
    return "Based on what you've described, I'd recommend monitoring your symptoms. If they worsen or you experience difficulty breathing, chest pain, or high fever, please seek immediate medical attention.";
  }
  if (category === "firstaid") {
    return "For most first aid situations, remember: Stay calm, ensure safety first, and call emergency services if needed. Keep your first aid kit stocked and accessible.";
  }
  if (category === "wellness") {
    return "Great question! A balanced diet, regular exercise, adequate sleep (7-9 hours), and stress management are the pillars of good health. Small, consistent changes make the biggest difference.";
  }
  return "That's a good question! While I can offer general health information, remember to consult a healthcare professional for personalized medical advice. Is there something specific about triage, first aid, or wellness I can help with?";
}
