"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { AgentKey } from "@/lib/os/agentConfig";

const WAKE_WORDS = ["hey servr", "hey server", "hé servr", "oke servr", "ok servr", "yo servr", "hey serv"];

const AGENT_TRIGGERS: [RegExp, AgentKey][] = [
  [/\b(vraag aan de?|zeg tegen de?|switch naar|ga naar)\s+cto\b/i, "cto"],
  [/\b(vraag aan de?|zeg tegen de?|switch naar|ga naar)\s+ceo\b/i, "ceo"],
  [/\b(vraag aan de?|zeg tegen de?|switch naar|ga naar)\s+scout\b/i, "scout"],
  [/\b(vraag aan de?|zeg tegen de?|switch naar|ga naar)\s+validator\b/i, "validator"],
  [/\b(vraag aan de?|zeg tegen de?|switch naar|ga naar)\s+cfo\b/i, "cfo"],
  [/\b(vraag aan de?|zeg tegen de?|switch naar|ga naar)\s+growth\b/i, "growth"],
  [/\b(vraag aan de?|zeg tegen de?|switch naar|ga naar)\s+launch\b/i, "launch"],
  [/\b(vraag aan de?|zeg tegen de?|switch naar|ga naar)\s+legal\b/i, "legal"],
  [/\b(vraag aan de?|zeg tegen de?|switch naar|ga naar)\s+ux\b/i, "ux"],
  [/\b(vraag aan de?|zeg tegen de?|switch naar|ga naar)\s+ops\b/i, "ops"],
  [/\b(vraag aan de?|zeg tegen de?|switch naar|ga naar)\s+dna\b/i, "dna"],
  [/\b(vraag aan de?|zeg tegen de?|switch naar|ga naar)\s+scenario\b/i, "scenario"],
  [/\b(vraag aan de?|zeg tegen de?|switch naar|ga naar)\s+security\b/i, "security"],
];

interface UseWakeWordOptions {
  onWakeWordDetected: () => void;
  onCommand: (command: string, targetAgent?: AgentKey) => void;
  onAgentSwitch: (agent: AgentKey) => void;
  enabled: boolean;
}

function playActivationSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  } catch {}
}

type SR = typeof SpeechRecognition;

function getSR(): SR | null {
  if (typeof window === "undefined") return null;
  return (
    (window as typeof window & { SpeechRecognition?: SR }).SpeechRecognition ??
    (window as typeof window & { webkitSpeechRecognition?: SR }).webkitSpeechRecognition ??
    null
  );
}

export function useWakeWord({ onWakeWordDetected, onCommand, onAgentSwitch, enabled }: UseWakeWordOptions) {
  const [isAwake, setIsAwake] = useState(false);
  const [isListeningForCommand, setIsListeningForCommand] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [wakeWordMode, setWakeWordMode] = useState(false);

  const wakeRecRef = useRef<SpeechRecognition | null>(null);
  const cmdRecRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const processCommand = useCallback((command: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsAwake(false);
    setIsListeningForCommand(false);
    setTranscript("");

    for (const [pattern, agent] of AGENT_TRIGGERS) {
      if (pattern.test(command)) {
        const clean = command.replace(pattern, "").replace(/^[,.\s]+/, "").trim();
        onAgentSwitch(agent);
        if (clean.length > 2) setTimeout(() => onCommand(clean, agent), 500);
        return;
      }
    }
    onCommand(command);
  }, [onCommand, onAgentSwitch]);

  const listenForCommand = useCallback(() => {
    const SR = getSR();
    if (!SR) return;
    cmdRecRef.current?.stop();

    const rec = new SR();
    rec.lang = "nl-BE";
    rec.continuous = false;
    rec.interimResults = true;

    rec.onresult = (ev: SpeechRecognitionEvent) => {
      let final = "";
      let interim = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const t = ev.results[i][0].transcript;
        if (ev.results[i].isFinal) final += t;
        else interim += t;
      }
      setTranscript(interim || final);
      if (final) processCommand(final);
    };
    rec.onend = () => { setIsListeningForCommand(false); setIsAwake(false); };
    cmdRecRef.current = rec;
    setIsListeningForCommand(true);
    rec.start();
  }, [processCommand]);

  const handleWake = useCallback((commandAfterWake: string) => {
    setIsAwake(true);
    onWakeWordDetected();
    playActivationSound();

    if (commandAfterWake && commandAfterWake.length > 2) {
      processCommand(commandAfterWake);
    } else {
      listenForCommand();
    }

    timeoutRef.current = setTimeout(() => {
      setIsAwake(false);
      setIsListeningForCommand(false);
    }, 10000);
  }, [onWakeWordDetected, processCommand, listenForCommand]);

  // Background wake word listener
  useEffect(() => {
    if (!wakeWordMode || !enabled) {
      wakeRecRef.current?.stop();
      return;
    }
    const SR = getSR();
    if (!SR) return;

    let active = true;

    function start() {
      if (!active || !SR) return;
      const rec = new SR();
      rec.lang = "nl-BE";
      rec.continuous = true;
      rec.interimResults = false;
      rec.maxAlternatives = 3;

      rec.onresult = (ev: SpeechRecognitionEvent) => {
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          if (!ev.results[i].isFinal) continue;
          for (let j = 0; j < ev.results[i].length; j++) {
            const text = ev.results[i][j].transcript.toLowerCase().trim();
            const hitWord = WAKE_WORDS.find(w => text.includes(w));
            if (hitWord) {
              let cmd = text;
              for (const w of WAKE_WORDS) cmd = cmd.replace(w, "").replace(/^[,.\s]+/, "").trim();
              handleWake(cmd);
              return;
            }
          }
        }
      };
      rec.onend = () => { if (active) setTimeout(start, 200); };
      rec.onerror = (ev: SpeechRecognitionErrorEvent) => {
        if (ev.error !== "no-speech" && active) setTimeout(start, 1000);
      };

      wakeRecRef.current = rec;
      try { rec.start(); } catch {}
    }

    start();
    return () => { active = false; wakeRecRef.current?.stop(); };
  }, [wakeWordMode, enabled, handleWake]);

  return { isAwake, isListeningForCommand, transcript, wakeWordMode, setWakeWordMode };
}
