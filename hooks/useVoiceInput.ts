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

const WAKE_WORDS = ["hey servr", "hey server", "hé servr", "hey serv", "oke servr", "ok servr"];

export type MicState = "off" | "permission-denied" | "listening" | "awake";

export function useVoiceInput(onCommand: (text: string) => void, lang = "nl-BE") {
  const [micState, setMicState] = useState<MicState>("off");
  const [interimText, setInterimText] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const recRef = useRef<SpeechRecognition | null>(null);
  const activeRef = useRef(false);

  useEffect(() => {
    if (getSR()) setIsSupported(true);
  }, []);

  const stop = useCallback(() => {
    activeRef.current = false;
    recRef.current?.stop();
    recRef.current = null;
    setMicState("off");
    setInterimText("");
  }, []);

  const startLoop = useCallback(() => {
    const SR = getSR();
    if (!SR || !activeRef.current) return;

    const rec = new SR();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (ev: SpeechRecognitionEvent) => {
      let final = "";
      let interim = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const t = ev.results[i][0].transcript;
        if (ev.results[i].isFinal) final += t;
        else interim += t;
      }

      const display = final || interim;

      // Check voor wake word in de transcript
      const lower = display.toLowerCase();
      const hitWord = WAKE_WORDS.find(w => lower.includes(w));

      if (hitWord) {
        // Extraheer het command na het wake word
        let cmd = lower.replace(hitWord, "").replace(/^[,.\s]+/, "").trim();
        if (!cmd && final) {
          // Wake word zonder command — wacht op volgend resultaat
          setMicState("awake");
          setInterimText("Spreek je vraag in...");
          return;
        }
        if (cmd) {
          setInterimText(cmd);
          if (final) {
            setInterimText("");
            onCommand(cmd);
          }
        }
      } else {
        setInterimText(display);
        if (final && final.trim().length > 2) {
          // Geen wake word — stuur direct (als al in awake state)
          if (micState === "awake") {
            setInterimText("");
            onCommand(final.trim());
          }
        }
      }
    };

    rec.onend = () => {
      setInterimText("");
      if (activeRef.current) {
        // Herstart automatisch
        setTimeout(() => startLoop(), 150);
      }
    };

    rec.onerror = (ev: SpeechRecognitionErrorEvent) => {
      if (ev.error === "not-allowed") {
        setMicState("permission-denied");
        activeRef.current = false;
        return;
      }
      // Bij andere errors: herstart
      if (activeRef.current) setTimeout(() => startLoop(), 500);
    };

    recRef.current = rec;
    try {
      rec.start();
      setMicState("listening");
    } catch { }
  }, [lang, onCommand, micState]);

  const start = useCallback(async () => {
    const SR = getSR();
    if (!SR) return;

    // Vraag micro permissie
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop()); // stop direct, we willen enkel permissie
    } catch {
      setMicState("permission-denied");
      return;
    }

    activeRef.current = true;
    startLoop();
  }, [startLoop]);

  const toggle = useCallback(() => {
    if (micState === "off" || micState === "permission-denied") {
      start();
    } else {
      stop();
    }
  }, [micState, start, stop]);

  const setAwake = useCallback(() => setMicState("awake"), []);

  return { micState, interimText, isSupported, toggle, stop, setAwake };
}
