import React, { useState } from 'react';

export interface ShinyTextProps {
  text: string;
  speed?: number;
  className?: string;
}

/**
 * React Bits inspired ShinyText
 * Renders a metallic light sweep across badges and headings.
 */
export const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  speed = 3.5,
  className = '',
}) => {
  return (
    <span
      className={`inline-block bg-clip-text text-transparent bg-[linear-gradient(110deg,#94a3b8_35%,#ffffff_50%,#38bdf8_60%,#94a3b8_75%)] bg-[length:220%_100%] animate-[shiny-sweep_var(--shiny-speed,3.5s)_linear_infinite] ${className}`}
      style={{ '--shiny-speed': `${speed}s` } as React.CSSProperties}
    >
      {text}
    </span>
  );
};

export interface DecryptedTextProps {
  text: string;
  className?: string;
}

const CIPHER_CHARS = '0123456789ABCDEF°′″NSWE◈◇▲';

/**
 * React Bits inspired DecryptedText
 * Keeps the exact original text in the DOM for screen-readers and tests,
 * while offering a nautical cipher scramble visual effect on hover.
 */
export const DecryptedText: React.FC<DecryptedTextProps> = ({ text, className = '' }) => {
  const [displayText, setDisplayText] = useState(text);
  const [isScrambling, setIsScrambling] = useState(false);

  const triggerScramble = () => {
    if (isScrambling) return;
    setIsScrambling(true);
    let iteration = 0;
    const totalIterations = Math.min(text.length, 14);

    const interval = setInterval(() => {
      setDisplayText(
        text
          .split('')
          .map((char, idx) => {
            if (char === ' ') return ' ';
            if (idx < (iteration / totalIterations) * text.length) {
              return text[idx];
            }
            return CIPHER_CHARS[(idx + iteration) % CIPHER_CHARS.length];
          })
          .join('')
      );

      iteration += 1;
      if (iteration > totalIterations) {
        clearInterval(interval);
        setDisplayText(text);
        setIsScrambling(false);
      }
    }, 32);
  };

  return (
    <span
      onMouseEnter={triggerScramble}
      className={`inline-block font-mono cursor-default select-none ${className}`}
      title={text}
    >
      {displayText}
    </span>
  );
};
