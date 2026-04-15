import { useRef, useState, useCallback } from "react";

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Strip emoji prefixes for cleaner speech
    const cleanText = text
      .replace(/🚨\s*EMERGENCY:\s*/g, "EMERGENCY: ")
      .replace(/⚠️/g, "")
      .replace(/[🎤🩺💊]/g, "");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to pick a calm, professional English voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) =>
        v.lang.startsWith("en") &&
        /samantha|karen|moira|fiona|google.*female|microsoft.*zira|aria/i.test(v.name)
    );
    const englishFallback = voices.find((v) => v.lang.startsWith("en"));
    utterance.voice = preferred || englishFallback || null;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking };
}
