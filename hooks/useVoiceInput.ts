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

const WAKE_WORDS = [
  "hey servr", "hey server", "hé servr", "hey serv",
  "oke servr", "ok servr", "yo servr", "hey surf",
  "hey serve", "hey survr",
];

export type MicState = "off" | "permission-denied" | "listening" | "awake";

export function useVoiceInput(onCommand: (text: string) => void) {
  const [micState, setMicState] = useState<MicState>("off");
  const [interimText, setInterimText] = useState("");
  const [isSupported, setIsSupported] = useState(false);

  // Refs — geen stale closures
  const recRef = useRef<SpeechRecognition | null>(null);
  const activeRef = useRef(false);
  const awakeRef = useRef(false); // true = wake word gedetecteerd, wacht op commando
  const onCommandRef = useRef(onCommand);
  onCommandRef.current = onCommand;

  useEffect(() => {
    if (getSR()) setIsSupported(true);
  }, []);

  const startRecognition = useCallback(() => {
    const SR = getSR();
    if (!SR || !activeRef.current) return;

    // Stop vorige instantie
    try { recRef.current?.stop(); } catch {}

    const rec = new SR();
    rec.lang = "nl-BE";
    rec.continuous = true;      // blijft luisteren, geen gaps
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (ev: SpeechRecognitionEvent) => {
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const transcript = ev.results[i][0].transcript.toLowerCase().trim();
        const isFinal = ev.results[i].isFinal;

        // Zoek wake word
        const hitWord = WAKE_WORDS.find(w => transcript.includes(w));

        if (hitWord) {
          // Extraheer command na wake word
          const cmd = transcript
            .replace(hitWord, "")
            .replace(/^[,.\s]+/, "")
            .trim();

          if (cmd.length > 2) {
            // Wake word + command in één zin: "hey servr wat moet ik doen"
            if (isFinal) {
              awakeRef.current = false;
              setMicState("listening");
              setInterimText("");
              onCommandRef.current(cmd);
            } else {
              awakeRef.current = true;
              setMicState("awake");
              setInterimText(cmd);
            }
          } else {
            // Alleen wake word, wacht op volgende zin
            awakeRef.current = true;
            setMicState("awake");
            setInterimText("Zeg je vraag...");
          }
        } else if (awakeRef.current) {
          // Al wakker — dit is het commando
          if (isFinal && transcript.length > 2) {
            awakeRef.current = false;
            setMicState("listening");
            setInterimText("");
            onCommandRef.current(transcript);
          } else {
            setInterimText(transcript);
          }
        }
        // Geen wake word en niet wakker — negeer (gewone achtergrondgeluiden)
      }
    };

    rec.onerror = (ev: SpeechRecognitionErrorEvent) => {
      if (ev.error === "not-allowed") {
        activeRef.current = false;
        awakeRef.current = false;
        setMicState("permission-denied");
        setInterimText("");
        return;
      }
      // Bij andere errors (no-speech, network): herstart na korte pauze
      if (activeRef.current) {
        setTimeout(() => startRecognition(), 300);
      }
    };

    rec.onend = () => {
      // Edge stopt soms automatisch — herstart als we nog actief zijn
      if (activeRef.current) {
        setTimeout(() => startRecognition(), 100);
      }
    };

    recRef.current = rec;
    try {
      rec.start();
    } catch {
      if (activeRef.current) setTimeout(() => startRecognition(), 500);
    }
  }, []);

  const start = useCallback(async () => {
    const SR = getSR();
    if (!SR) return;

    // Vraag micro permissie via getUserMedia — triggert de browser popup
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
    } catch {
      setMicState("permission-denied");
      return;
    }

    activeRef.current = true;
    awakeRef.current = false;
    setMicState("listening");
    setInterimText("");
    startRecognition();
  }, [startRecognition]);

  const stop = useCallback(() => {
    activeRef.current = false;
    awakeRef.current = false;
    try { recRef.current?.stop(); } catch {}
    recRef.current = null;
    setMicState("off");
    setInterimText("");
  }, []);

  const toggle = useCallback(() => {
    if (micState === "off" || micState === "permission-denied") start();
    else stop();
  }, [micState, start, stop]);

  return { micState, interimText, isSupported, toggle, stop };
}
