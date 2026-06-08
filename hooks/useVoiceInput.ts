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

// Alle mogelijke varianten van "hey servr" — breed net
const WAKE_WORDS = [
  "hey servr", "hey server", "hé servr", "hey serv",
  "oke servr", "ok servr", "yo servr", "hey surf",
  "hey serve", "hey survr", "hey serfr", "hey cervr",
  // Nederlandse uitspraak varianten
  "ee servr", "ee server", "he server", "he servr",
  // Zonder 'hey'
  "servr", "server,", "serv,",
];

export type MicState = "off" | "permission-denied" | "listening" | "awake";

export function useVoiceInput(onCommand: (text: string) => void) {
  const [micState, setMicState] = useState<MicState>("off");
  const [rawTranscript, setRawTranscript] = useState(""); // wat Edge ECHT hoort
  const [isSupported, setIsSupported] = useState(false);

  const recRef = useRef<SpeechRecognition | null>(null);
  const activeRef = useRef(false);
  const awakeRef = useRef(false);
  const onCommandRef = useRef(onCommand);
  onCommandRef.current = onCommand;

  useEffect(() => {
    if (getSR()) setIsSupported(true);
  }, []);

  const startRecognition = useCallback(() => {
    const SR = getSR();
    if (!SR || !activeRef.current) return;

    try { recRef.current?.stop(); } catch {}

    const rec = new SR();
    rec.lang = "nl-BE";
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 3; // meer alternatieven = betere kans op match

    rec.onresult = (ev: SpeechRecognitionEvent) => {
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const isFinal = ev.results[i].isFinal;

        // Controleer ALLE alternatieven
        const transcripts: string[] = [];
        for (let j = 0; j < ev.results[i].length; j++) {
          transcripts.push(ev.results[i][j].transcript.toLowerCase().trim());
        }
        const bestTranscript = transcripts[0];

        // Toon altijd wat Edge hoort (debug + UX)
        setRawTranscript(bestTranscript);

        // Zoek wake word in alle alternatieven
        const hitWord = transcripts.reduce<string | undefined>((found, t) => {
          if (found) return found;
          return WAKE_WORDS.find(w => t.includes(w));
        }, undefined);

        if (hitWord) {
          // Wake word gevonden — extraheer command
          const cmdSource = transcripts.find(t => t.includes(hitWord)) ?? bestTranscript;
          const cmd = cmdSource
            .replace(hitWord, "")
            .replace(/^[,.\s]+/, "")
            .trim();

          if (cmd.length > 2 && isFinal) {
            // "hey servr doe een audit" — alles in één zin
            awakeRef.current = false;
            setMicState("listening");
            setRawTranscript("");
            onCommandRef.current(cmd);
          } else if (cmd.length > 2) {
            awakeRef.current = true;
            setMicState("awake");
          } else {
            // Alleen wake word, wacht op volgende zin
            awakeRef.current = true;
            setMicState("awake");
            setRawTranscript("Zeg je vraag...");
          }
        } else if (awakeRef.current && isFinal && bestTranscript.length > 2) {
          // Wakker en dit is het commando
          awakeRef.current = false;
          setMicState("listening");
          setRawTranscript("");
          onCommandRef.current(bestTranscript);
        }
      }
    };

    rec.onerror = (ev: SpeechRecognitionErrorEvent) => {
      if (ev.error === "not-allowed") {
        activeRef.current = false;
        awakeRef.current = false;
        setMicState("permission-denied");
        setRawTranscript("");
        return;
      }
      if (activeRef.current) setTimeout(() => startRecognition(), 500);
    };

    rec.onend = () => {
      if (activeRef.current) setTimeout(() => startRecognition(), 150);
    };

    recRef.current = rec;
    try { rec.start(); } catch {
      if (activeRef.current) setTimeout(() => startRecognition(), 500);
    }
  }, []);

  const start = useCallback(async () => {
    const SR = getSR();
    if (!SR) return;

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
    setRawTranscript("");
    startRecognition();
  }, [startRecognition]);

  const stop = useCallback(() => {
    activeRef.current = false;
    awakeRef.current = false;
    try { recRef.current?.stop(); } catch {}
    recRef.current = null;
    setMicState("off");
    setRawTranscript("");
  }, []);

  const toggle = useCallback(() => {
    if (micState === "off" || micState === "permission-denied") start();
    else stop();
  }, [micState, start, stop]);

  // Stuur handmatig een commando (vanuit tekst input)
  const sendManual = useCallback((text: string) => {
    if (text.trim()) onCommandRef.current(text.trim());
  }, []);

  return { micState, rawTranscript, isSupported, toggle, stop, sendManual };
}
