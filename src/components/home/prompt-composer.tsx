"use client";

import { ArrowUp, ImagePlus, Mic, Square, X } from "lucide-react";
import { type RefObject, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { IconButton } from "@/components/ui/button";
import { FieldError } from "@/components/ui/feedback";

interface Recognition {
  lang: string;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | undefined {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}
const noop = () => () => {};

export function PromptComposer({
  value,
  onChange,
  onSubmit,
  error,
  inputRef,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  error?: string | null;
  inputRef: RefObject<HTMLTextAreaElement | null>;
}) {
  const voiceSupported = useSyncExternalStore(noop, () => !!recognitionCtor(), () => false);
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const [listening, setListening] = useState(false);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const [photo, setPhoto] = useState<{ url: string; name: string } | null>(null);
  const recognition = useRef<Recognition | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);

  useEffect(() => () => recognition.current?.stop(), []);
  useEffect(() => {
    const url = photo?.url;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [photo]);

  const toggleVoice = () => {
    setVoiceNote(null);
    if (!voiceSupported) return;
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.onresult = (event) => {
      const transcript = Array.from(event.results, (r) => r[0]?.transcript ?? "").join(" ").trim();
      if (transcript) onChange(`${latest.current} ${transcript}`.trim());
    };
    rec.onerror = (event) => {
      setVoiceNote(
        event.error === "not-allowed" || event.error === "service-not-allowed"
          ? "Microphone permission was denied. Type your order, or allow the microphone in browser settings."
          : "Couldn't hear that. Try again or type your order.",
      );
    };
    rec.onend = () => setListening(false);
    recognition.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setVoiceNote("Voice input couldn't start. Type your order instead.");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <form
        className="rounded-card border border-line bg-card focus-within:border-primary"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <label htmlFor="prompt" className="sr-only">What do you want to order, and from which restaurant?</label>
        <textarea
          id="prompt"
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit();
            }
          }}
          rows={2}
          maxLength={200}
          enterKeyHint="go"
          placeholder="Dish and restaurant, e.g. Chicken Biryani from SS Hyderabad Biryani"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "prompt-error" : undefined}
          className="block w-full resize-none rounded-t-card bg-transparent px-4 pt-3.5 text-[17px] leading-snug outline-none placeholder:text-ink2"
        />
        {photo ? (
          <div className="mx-4 mb-1 flex items-center gap-2 rounded-btn bg-fill p-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
            <img src={photo.url} alt="" className="size-10 rounded-lg object-cover" />
            <span className="min-w-0 flex-1 truncate text-[14px] text-ink2">{photo.name}</span>
            <IconButton label="Remove photo" onClick={() => setPhoto(null)}>
              <X aria-hidden size={18} />
            </IconButton>
          </div>
        ) : null}
        <div className="flex items-center gap-1 border-t border-line px-2 py-1.5">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setPhoto({ url: URL.createObjectURL(file), name: file.name });
              e.target.value = "";
            }}
          />
          <IconButton label="Attach a photo" onClick={() => fileRef.current?.click()}>
            <ImagePlus aria-hidden size={22} />
          </IconButton>
          <IconButton
            label={listening ? "Stop voice input" : "Voice input"}
            aria-pressed={listening}
            aria-disabled={hydrated && !voiceSupported ? true : undefined}
            onClick={toggleVoice}
            className={listening ? "bg-tint text-green" : hydrated && !voiceSupported ? "text-ink2 opacity-50" : undefined}
          >
            {listening ? <Square aria-hidden size={18} /> : <Mic aria-hidden size={22} />}
          </IconButton>
          <span aria-live="polite" className="min-w-0 flex-1 truncate text-[14px] text-green">
            {listening ? "Listening…" : ""}
          </span>
          <button
            type="submit"
            aria-label="Find branches"
            disabled={!value.trim()}
            className="inline-flex h-11 w-14 items-center justify-center rounded-btn bg-primary text-white active:opacity-75 disabled:opacity-40"
          >
            <ArrowUp aria-hidden size={22} strokeWidth={2.5} />
          </button>
        </div>
      </form>
      {error ? <FieldError id="prompt-error">{error}</FieldError> : null}
      {voiceNote ? <p role="status" className="text-[14px] text-ink2">{voiceNote}</p> : null}
      {hydrated && !voiceSupported ? (
        <p className="text-[14px] text-ink2">Voice input isn&apos;t supported in this browser. Type your order instead.</p>
      ) : null}
      {photo ? (
        <p className="text-[14px] text-ink2">
          The photo stays on this device. Rusi can&apos;t recognise dishes from photos yet, so name the dish and restaurant too.
        </p>
      ) : null}
    </div>
  );
}
