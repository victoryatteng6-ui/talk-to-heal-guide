import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Send, Phone, Volume2, VolumeX, Mic, MicOff } from "lucide-react";
import { ChatBubble } from "@/components/ChatBubble";
import { Waveform } from "@/components/Waveform";
import { Disclaimer } from "@/components/Disclaimer";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { streamChat } from "@/lib/streamChat";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const { speak, stop: stopSpeaking, isSpeaking } = useTextToSpeech();
  const [ttsEnabled, setTtsEnabled] = useState(true);

  const [messages, setMessages] = useState<Message[]>(() => {
    const greeting = category && categoryGreetings[category]
      ? categoryGreetings[category]
      : "Hello! I'm your health assistant. Ask me about symptoms, first aid, or wellness tips. How can I help?";
    return [{ id: "1", role: "assistant", content: greeting }];
  });

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastSpokenRef = useRef<string>("");

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    stopSpeaking();

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    const chatMessages = newMessages.map((m) => ({ role: m.role, content: m.content }));

    try {
      await streamChat({
        messages: chatMessages,
        onDelta: (chunk) => {
          assistantSoFar += chunk;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && last.id.startsWith("stream-")) {
              return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
            }
            return [...prev, { id: "stream-" + Date.now(), role: "assistant", content: assistantSoFar }];
          });
        },
        onDone: () => {
          setIsLoading(false);
          if (ttsEnabled && assistantSoFar && assistantSoFar !== lastSpokenRef.current) {
            lastSpokenRef.current = assistantSoFar;
            speak(assistantSoFar);
          }
        },
      });
    } catch (e: any) {
      setIsLoading(false);
      toast({ variant: "destructive", title: "Error", description: e.message || "Failed to get response" });
    }
  }, [messages, isLoading, toast, ttsEnabled, speak, stopSpeaking]);

  const { isListening, transcript, startListening, stopListening, isSupported } = useSpeechRecognition(
    useCallback((text: string) => {
      sendMessage(text);
    }, [sendMessage])
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (voiceMode && isSupported) {
      startListening();
    }
  }, []);

  useEffect(() => {
    window.speechSynthesis?.getVoices();
    const handleVoices = () => window.speechSynthesis?.getVoices();
    window.speechSynthesis?.addEventListener?.("voiceschanged", handleVoices);
    return () => window.speechSynthesis?.removeEventListener?.("voiceschanged", handleVoices);
  }, []);

  const handleSend = () => sendMessage(input);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      stopSpeaking();
      startListening();
    }
  };

  const isEmergency = messages.some(
    (m) => m.role === "assistant" && m.content.includes("🚨 EMERGENCY:")
  );

  return (
    <div className="flex flex-1 flex-col bg-background">
      {/* Fixed disclaimer at top */}
      <div className="sticky top-0 z-40 px-4 py-2 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto max-w-2xl">
          <Disclaimer variant="fixed" />
        </div>
      </div>

      {isEmergency && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-destructive px-4 py-4 text-center"
        >
          <p className="text-sm font-semibold text-destructive-foreground mb-3">
            ⚠️ Emergency symptoms detected. Please call emergency services immediately.
          </p>
          <a
            href="tel:911"
            className="inline-flex items-center gap-2 rounded-xl bg-destructive-foreground px-8 py-3 text-sm font-bold text-destructive shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            <Phone className="h-5 w-5" />
            Call Emergency Services (911)
          </a>
        </motion.div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="container mx-auto max-w-2xl space-y-4">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} role={msg.role} content={msg.content} />
          ))}
          {isListening && transcript && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-muted-foreground italic text-right"
            >
              🎤 {transcript}
            </motion.div>
          )}
          {isLoading && (
            <div className="flex gap-1 items-center text-muted-foreground text-sm">
              <span className="animate-pulse">●</span>
              <span className="animate-pulse" style={{ animationDelay: "0.2s" }}>●</span>
              <span className="animate-pulse" style={{ animationDelay: "0.4s" }}>●</span>
            </div>
          )}
          {isSpeaking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-sm text-primary"
            >
              <Volume2 className="h-4 w-4" />
              <Waveform isActive barCount={5} color="primary" />
              <span className="text-muted-foreground">Speaking…</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t border-border bg-card/90 backdrop-blur-md px-4 py-3">
        <div className="container mx-auto flex max-w-2xl items-center gap-3">
          {/* Mic button with active color */}
          {isSupported && (
            <button
              onClick={handleMicClick}
              className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isListening
                  ? "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/30"
                  : "bg-primary/10 text-primary hover:bg-primary/20"
              }`}
              aria-label={isListening ? "Stop listening" : "Start listening"}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              {isListening && (
                <span className="absolute inset-0 rounded-full bg-destructive/30 animate-pulse-ring" />
              )}
            </button>
          )}

          <div className="flex flex-1 items-center rounded-xl border border-input bg-background px-4 py-2 focus-within:ring-2 focus-within:ring-ring">
            {isListening && (
              <div className="mr-2">
                <Waveform isActive barCount={3} color="primary" />
              </div>
            )}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "Listening… speak now" : "Describe your symptoms…"}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              aria-label="Type your health question"
              disabled={isLoading}
            />
            {/* Speaker toggle with active color */}
            <button
              onClick={() => {
                if (isSpeaking) stopSpeaking();
                else setTtsEnabled((v) => !v);
              }}
              className={`ml-1 rounded-lg p-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isSpeaking
                  ? "text-primary bg-primary/10"
                  : ttsEnabled
                    ? "text-primary hover:bg-primary/10"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              aria-label={ttsEnabled ? "Mute voice" : "Unmute voice"}
              title={isSpeaking ? "Stop speaking" : ttsEnabled ? "Voice on" : "Voice off"}
            >
              {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="ml-1 rounded-lg p-2 text-primary transition-colors hover:bg-primary/10 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
