"use client";

import { useCallback, useRef } from "react";

const AGENT_VOICES: Record<string, { pitch: number; rate: number }> = {
  ceo:       { pitch: 1.0, rate: 0.95 },
  cto:       { pitch: 0.9, rate: 1.05 },
  scout:     { pitch: 1.1, rate: 1.0  },
  validator: { pitch: 0.8, rate: 0.9  },
  cfo:       { pitch: 0.95, rate: 0.95 },
  growth:    { pitch: 1.1, rate: 1.1  },
  dna:       { pitch: 1.0, rate: 0.9  },
  launch:    { pitch: 1.05, rate: 1.0 },
  legal:     { pitch: 0.95, rate: 0.9 },
  security:  { pitch: 0.85, rate: 0.95 },
  ops:       { pitch: 1.0, rate: 1.0  },
  ux:        { pitch: 1.1, rate: 1.0  },
  scenario:  { pitch: 1.0, rate: 0.9  },
};

function cleanForSpeech(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .replace(/\[.*?\]\(.*?\)/g, "")
    .replace(/\[NAVIGATE:.*?\]/g, "")
    .replace(/\[LEARN:.*?\]/g, "")
    .replace(/\[HIGHLIGHT:.*?\]/g, "")
    .replace(/\[ASK_AGENT:.*?\]/g, "")
    .replace(/\[SWITCH_AGENT:.*?\]/g, "")
    .trim();
}

export function useVoiceOutput() {
  const synthRef = useRef<SpeechSynthesis | null>(
    typeof window !== "undefined" ? window.speechSynthesis : null
  );

  const speak = useCallback((text: string, agentName = "ceo") => {
    const synth = synthRef.current;
    if (!synth) return;
    synth.cancel();

    const clean = cleanForSpeech(text);
    const spoken = clean.length > 500 ? clean.slice(0, 500) + "..." : clean;
    if (!spoken) return;

    const utterance = new SpeechSynthesisUtterance(spoken);
    const voiceConfig = AGENT_VOICES[agentName] ?? AGENT_VOICES.ceo;

    utterance.lang = "nl-NL";
    utterance.pitch = voiceConfig.pitch;
    utterance.rate = voiceConfig.rate;
    utterance.volume = 0.8;

    // Pick Dutch voice
    const voices = synth.getVoices();
    const dutch = voices.find(v => v.lang.startsWith("nl") && v.name.toLowerCase().includes("female"))
      ?? voices.find(v => v.lang.startsWith("nl"));
    if (dutch) utterance.voice = dutch;

    synth.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel();
  }, []);

  const isSpeaking = useCallback(() => {
    return synthRef.current?.speaking ?? false;
  }, []);

  return { speak, stopSpeaking, isSpeaking };
}
