import { useEffect, useRef, useState } from "react";

type TextTypeProps = {
  text: string;
  typingSpeed?: number;
  startDelay?: number;
};

/**
 * Typewriter reveal with blinking cursor — same idea as
 * [React Bits Text Type](https://reactbits.dev/text-animations/text-type), implemented without extra deps.
 * Respects `prefers-reduced-motion`: shows full text immediately.
 */
export function TextType({ text, typingSpeed = 42, startDelay = 280 }: TextTypeProps) {
  const [displayed, setDisplayed] = useState("");
  const [reduceMotion, setReduceMotion] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      setDisplayed(text);
      return;
    }

    setDisplayed("");
    timeoutRef.current = setTimeout(() => {
      let i = 0;
      intervalRef.current = setInterval(() => {
        i += 1;
        setDisplayed(text.slice(0, i));
        if (i >= text.length && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }, typingSpeed);
    }, startDelay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, typingSpeed, startDelay, reduceMotion]);

  return (
    <span className="inline" aria-live="polite">
      <span>{displayed}</span>
      {!reduceMotion ? (
        <span
          className="ml-0.5 inline-block min-w-[0.5ch] translate-y-[-0.02em] font-light text-ink animate-cursor-blink"
          aria-hidden
        >
          |
        </span>
      ) : null}
    </span>
  );
}

type LoopingBlurTypewriterProps = {
  phrases: readonly string[];
  typingSpeed?: number;
  startDelay?: number;
  betweenPhraseDelay?: number;
  holdMs?: number;
  blurOutMs?: number;
  className?: string;
};

/**
 * Cycles phrases: type → hold → blur/fade → next (loop).
 * `prefers-reduced-motion`: crossfades full lines on a timer (no blur).
 */
export function LoopingBlurTypewriter({
  phrases,
  typingSpeed = 40,
  startDelay = 320,
  betweenPhraseDelay = 200,
  holdMs = 2400,
  blurOutMs = 500,
  className = "",
}: LoopingBlurTypewriterProps) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [exiting, setExiting] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rotateRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const n = phrases.length;
  const phrase = n > 0 ? phrases[phraseIndex % n]! : "";

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  /** Reduced motion: show full lines and rotate on an interval. */
  useEffect(() => {
    if (!reduceMotion || n === 0) return;
    setDisplayed(phrase);
    if (n <= 1) return;
    rotateRef.current = setInterval(() => {
      setPhraseIndex((i) => (i + 1) % n);
    }, Math.max(4000, holdMs + blurOutMs));
    return () => {
      if (rotateRef.current) clearInterval(rotateRef.current);
    };
  }, [reduceMotion, n, phrase, holdMs, blurOutMs]);

  /** Type current phrase; does not depend on `exiting` (avoids clearing hold timer). */
  useEffect(() => {
    if (reduceMotion || n === 0) return;

    setDisplayed("");
    const delay = phraseIndex === 0 ? startDelay : betweenPhraseDelay;

    timeoutRef.current = setTimeout(() => {
      let i = 0;
      intervalRef.current = setInterval(() => {
        i += 1;
        setDisplayed(phrase.slice(0, i));
        if (i >= phrase.length) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          holdRef.current = setTimeout(() => setExiting(true), holdMs);
        }
      }, typingSpeed);
    }, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (holdRef.current) clearTimeout(holdRef.current);
    };
  }, [phraseIndex, phrase, reduceMotion, n, typingSpeed, startDelay, betweenPhraseDelay, holdMs]);

  /** After blur transition, advance to next phrase. */
  useEffect(() => {
    if (reduceMotion || !exiting) return;

    const t = setTimeout(() => {
      setExiting(false);
      setPhraseIndex((i) => (i + 1) % n);
    }, blurOutMs);

    return () => clearTimeout(t);
  }, [exiting, reduceMotion, blurOutMs, n]);

  return (
    <span className={`inline-block min-h-[1.2em] w-full ${className}`} aria-live="polite">
      <span
        className={`inline-block w-full text-balance transition-[filter,opacity,transform] motion-safe:duration-500 motion-safe:ease-out ${
          exiting ? "motion-safe:blur-sm motion-safe:opacity-0 motion-safe:scale-[0.99]" : "opacity-100"
        }`}
      >
        <span>{displayed}</span>
        {!reduceMotion ? (
          <span
            className="ml-0.5 inline-block min-w-[0.5ch] translate-y-[-0.02em] font-light text-ink animate-cursor-blink"
            aria-hidden
          >
            |
          </span>
        ) : null}
      </span>
    </span>
  );
}
