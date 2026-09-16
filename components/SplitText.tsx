
import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string;
  splitType?: 'chars' | 'words' | 'lines';
  from?: { opacity: number; y: number };
  to?: { opacity: number; y: number };
  threshold?: number;
  rootMargin?: string;
  textAlign?: 'left' | 'center' | 'right';
  display?: string;
  // Use React.ElementType to resolve "Cannot find namespace 'JSX'" error
  tag?: React.ElementType;
  onLetterAnimationComplete?: () => void;
}

const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = '',
  delay = 50,
  duration = 1.25,
  ease = 'power3.out',
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '-100px',
  textAlign = 'center',
  display = 'block',
  tag: Tag = 'p',
  onLetterAnimationComplete
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chars = text.split('');

  const onLetterAnimationCompleteRef = useRef(onLetterAnimationComplete);
  useEffect(() => {
    onLetterAnimationCompleteRef.current = onLetterAnimationComplete;
  }, [onLetterAnimationComplete]);

  const fromOpacity = from.opacity;
  const fromY = from.y;
  const toOpacity = to.opacity;
  const toY = to.y;

  useEffect(() => {
    if (!containerRef.current) return;

    const charElements = containerRef.current.querySelectorAll('.split-char');
    if (charElements.length === 0) return;

    // Set initial frame state immediately to prevent visual flash before timeline boots
    gsap.set(charElements, { opacity: fromOpacity, y: fromY });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: `top bottom-=${threshold * 100}%`,
        once: true,
      },
      onComplete: () => {
        if (onLetterAnimationCompleteRef.current) {
          onLetterAnimationCompleteRef.current();
        }
      }
    });

    tl.fromTo(
      charElements,
      { opacity: fromOpacity, y: fromY },
      {
        opacity: toOpacity,
        y: toY,
        duration,
        ease,
        stagger: delay / 1000,
      }
    );

    return () => {
      tl.kill();
      gsap.killTweensOf(charElements);
      ScrollTrigger.getAll().forEach(t => {
        if (t.trigger === containerRef.current) t.kill();
      });
    };
  }, [text, delay, duration, ease, fromOpacity, fromY, toOpacity, toY, threshold]);

  return (
    <Tag
      ref={containerRef as any}
      className={`split-parent ${className}`}
      style={{ 
        textAlign, 
        overflow: 'hidden', 
        display
      }}
    >
      {chars.map((char, i) => (
        <span
          key={i}
          className="split-char"
          style={{ 
            display: 'inline-block', 
            whiteSpace: char === ' ' ? 'pre' : 'normal',
            willChange: 'transform, opacity'
          }}
        >
          {char}
        </span>
      ))}
    </Tag>
  );
};

export default SplitText;
