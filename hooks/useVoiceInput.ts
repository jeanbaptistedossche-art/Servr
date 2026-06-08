"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type SR = typeof SpeechRecognition;

function getSR(): SR | null {
  if (typeof window === "undefined") return null;
  return (
    (window as typeof window & { SpeechRecognition?: SR }).SpeechRecognition ??
    (window as typeof window & { webkitSpeechRecognition?: SR }).webkitSpeechRecognition ??
    null
  );
}

// Vraagt micro permissie via getUserMedia — triggert de browser popup in Edge/Chrome
async function requestMicPermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop direct — we willen enkel de permissie, niet opnemen
    stream.getTracks().forEach(t => t.stop());
    return true;
  } catch {
    return false;
  }
}

export function useVoiceInput(onTranscript: (text: string) => void, lang = "nl-BE") {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check support on mount
  useEffect(() => {
    if (getSR()) setIsSupported(true);
    // Check if permission already granted
    navigator.permissions?.query({ name: "microphone" as PermissionName })
      .then(status => { if (status.state === "granted") setPermissionGranted(true); })
      .catch(() => {});
  }, []);

  const startListening = useCallback(async () => {
    const SR = getSR();
    if (!SR) { setIsSupported(false); return; }

    // Vraag permissie als nog niet gegeven
    if (!permissionGranted) {
      const ok = await requestMicPermission();
      if (!ok) return;
      setPermissionGranted(true);
    }

    recognitionRef.current?.stop();

    const recognition = new SR();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend   = () => { setIsListening(false); setInterimText(""); };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let final = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      setInterimText(interim);
      if (final) { setInterimText(""); onTranscript(final); }
    };

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      console.warn("Speech error:", e.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch {}
  }, [onTranscript, lang, permissionGranted]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setInterimText("");
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) stopListening();
    else startListening();
  }, [isListening, startListening, stopListening]);

  return { isListening, isSupported, permissionGranted, interimText, toggleListening, startListening, stopListening };
}
