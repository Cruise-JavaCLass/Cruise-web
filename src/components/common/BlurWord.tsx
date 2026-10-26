import { useEffect, useState, useRef } from 'react';

export function BlurWord({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
      setTrigger((t) => t + 1);
    }, 2800);
    return () => clearInterval(interval);
  }, [words.length]);

  const currentWord = words[index] || '';
  const letters = currentWord.split('');
  const STAGGER = 40;
  const DURATION = 450;

  const [letterStates, setLetterStates] = useState<{ opacity: number; blur: number }[]>(
    letters.map(() => ({ opacity: 0, blur: 16 }))
  );
  const framesRef = useRef<number[]>([]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    framesRef.current.forEach(cancelAnimationFrame);
    timersRef.current.forEach(clearTimeout);
    framesRef.current = [];
    timersRef.current = [];

    setLetterStates(letters.map(() => ({ opacity: 0, blur: 16 })));

    letters.forEach((_, i) => {
      const t = setTimeout(() => {
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / DURATION, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setLetterStates((prev) => {
            const next = [...prev];
            next[i] = { opacity: eased, blur: 16 * (1 - eased) };
            return next;
          });
          if (progress < 1) {
            const id = requestAnimationFrame(tick);
            framesRef.current.push(id);
          }
        };
        const id = requestAnimationFrame(tick);
        framesRef.current.push(id);
      }, i * STAGGER);
      timersRef.current.push(t);
    });

    return () => {
      framesRef.current.forEach(cancelAnimationFrame);
      timersRef.current.forEach(clearTimeout);
    };
  }, [trigger, currentWord]);

  return (
    <span className="inline-block maritime-shimmer-text font-serif italic font-normal">
      {letters.map((char, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            opacity: letterStates[i]?.opacity ?? 0,
            filter: `blur(${letterStates[i]?.blur ?? 16}px)`,
          }}
        >
          {char}
        </span>
      ))}
    </span>
  );
}
