import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Send, Volume2, VolumeX, Mic, MicOff, ImagePlus, X } from "lucide-react";
import { ChatBubble } from "@/components/ChatBubble";
import { Waveform } from "@/components/Waveform";
import { Disclaimer } from "@/components/Disclaimer";
import { SOSBanner } from "@/components/SOSBanner";
import { HealthProfileSheet } from "@/components/HealthProfileSheet";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { streamChat, Msg as StreamMsg } from "@/lib/streamChat";
import { useToast } from "@/hooks/use-toast";
import { detectEmergency } from "@/lib/triage";
import { loadProfile, profileToContext } from "@/lib/healthProfile";

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string | ContentPart[];
}

const categoryGreetings: Record<string, string> = {
  triage: "I can help assess your symptoms. Please describe what you're experiencing — you can also attach a photo.",
  firstaid: "I can walk you through first aid. Describe what happened or attach a photo of the injury.",
  wellness: "Let's talk about your wellness — nutrition, exercise, mental health, or preventive care.",
};

const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4MB

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getTextFromContent(c: Message["content"]): string {
  if (typeof c === "string") return c;
  return c.filter((p): p is { type: "text"; text: string } => p.type === "text").map((p) => p.text).join(" ");
}

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
      : "Hello! I'm your health assistant. Describe symptoms, attach a photo of a report or visible symptom, or ask about wellness.";
    return [{ id: "1", role: "assistant", content: greeting }];
  });

  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emergencyActive, setEmergencyActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastSpokenRef = useRef<string>("");

  const sendMessage = useCallback(async (text: string, imageDataUrl?: string | null) => {
    const trimmed = text.trim();
    if ((!trimmed && !imageDataUrl) || isLoading) return;

    stopSpeaking();

    // Rule-based emergency detection (instant)
    if (detectEmergency(trimmed)) setEmergencyActive(true);

    const content: string | ContentPart[] = imageDataUrl
      ? [
          { type: "text", text: trimmed || "Please analyze this image." },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ]
      : trimmed;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setPendingImage(null);
    setIsLoading(true);

    let assistantSoFar = "";
    const chatMessages: StreamMsg[] = newMessages.map((m) => ({
      role: m.role,
      content: m.content as any,
    }));
    const profileContext = profileToContext(loadProfile());

    try {
      await streamChat({
        messages: chatMessages,
        profileContext,
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
          // Mirror AI's emergency tag too
          if (assistantSoFar.includes("🚨 EMERGENCY:")) setEmergencyActive(true);
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
    useCallback((text: string) => { sendMessage(text); }, [sendMessage])
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (voiceMode && isSupported) startListening();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.speechSynthesis?.getVoices();
    const handleVoices = () => window.speechSynthesis?.getVoices();
    window.speechSynthesis?.addEventListener?.("voiceschanged", handleVoices);
    return () => window.speechSynthesis?.removeEventListener?.("voiceschanged", handleVoices);
  }, []);

  const handleSend = () => sendMessage(input, pendingImage);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMicClick = () => {
    if (isListening) stopListening();
    else { stopSpeaking(); startListening(); }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "Unsupported file", description: "Please upload an image." });
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast({ variant: "destructive", title: "Image too large", description: "Max 4 MB." });
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setPendingImage(dataUrl);
    } catch {
      toast({ variant: "destructive", title: "Could not read image" });
    }
  };

  return (
    <div className="flex flex-1 flex-col bg-background">
      {/* Top bar: disclaimer + profile */}
      <div className="sticky top-0 z-40 px-4 py-2 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto flex max-w-2xl items-center gap-3">
          <div className="flex-1"><Disclaimer variant="fixed" /></div>
          <HealthProfileSheet />
        </div>
      </div>

      {emergencyActive && <SOSBanner number="112" />}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="container mx-auto max-w-2xl space-y-4">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} role={msg.role} content={msg.content} />
          ))}
          {isListening && transcript && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted-foreground italic text-right">
              🎤 {transcript}
            </motion.div>
          )}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 rounded-xl bg-chat-bot px-4 py-3 w-fit"
            >
              <Waveform isActive barCount={4} color="primary" />
              <span className="text-xs text-muted-foreground">Analyzing…</span>
            </motion.div>
          )}
          {isSpeaking && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-sm text-primary">
              <Volume2 className="h-4 w-4" />
              <Waveform isActive barCount={5} color="primary" />
              <span className="text-muted-foreground">Speaking…</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Pending image preview */}
      {pendingImage && (
        <div className="border-t border-border bg-card/50 px-4 py-2">
          <div className="container mx-auto max-w-2xl">
            <div className="relative inline-block">
              <img src={pendingImage} alt="Pending upload" className="max-h-24 rounded-lg border border-border" />
              <button
                onClick={() => setPendingImage(null)}
                className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow-md hover:scale-110 transition-transform"
                aria-label="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="border-t border-border bg-card/90 backdrop-blur-md px-4 py-3">
        <div className="container mx-auto flex max-w-2xl items-center gap-2">
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
              {isListening && <span className="absolute inset-0 rounded-full bg-destructive/30 animate-pulse-ring" />}
            </button>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Attach image"
            title="Attach photo of report or symptom"
          >
            <ImagePlus className="h-5 w-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="flex flex-1 items-center rounded-xl border border-input bg-background px-4 py-2 focus-within:ring-2 focus-within:ring-ring">
            {isListening && (<div className="mr-2"><Waveform isActive barCount={3} color="primary" /></div>)}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={pendingImage ? "Add a question (optional)…" : isListening ? "Listening… speak now" : "Describe your symptoms…"}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              aria-label="Type your health question"
              disabled={isLoading}
            />
            <button
              onClick={() => { if (isSpeaking) stopSpeaking(); else setTtsEnabled((v) => !v); }}
              className={`ml-1 rounded-lg p-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isSpeaking ? "text-primary bg-primary/10"
                : ttsEnabled ? "text-primary hover:bg-primary/10"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              aria-label={ttsEnabled ? "Mute voice" : "Unmute voice"}
              title={isSpeaking ? "Stop speaking" : ttsEnabled ? "Voice on" : "Voice off"}
            >
              {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <button
              onClick={handleSend}
              disabled={(!input.trim() && !pendingImage) || isLoading}
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
