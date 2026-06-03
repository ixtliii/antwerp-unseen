import { useRef, useEffect, type ReactNode } from 'react';
import './blurText.css';

interface BlurTextProps {
    children: ReactNode;
    delay?:   number;   // ms before animation fires after intersection
    duration?: number;  // ms — mapped to CSS variable
    className?: string;
}

/**
 * Wraps children in a span that fades + un-blurs in on scroll.
 * Wrap the semantic tag outside: <h1><BlurText>text</BlurText></h1>
 */
const BlurText = ({ children, delay = 0, duration = 1100, className = '' }: BlurTextProps) => {
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setTimeout(() => el.classList.add('blur-text--visible'), delay);
                    observer.disconnect();
                }
            },
            { threshold: 0.05 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [delay]);

    return (
        <span
            ref={ref}
            className={`blur-text ${className}`}
            style={{ '--blur-duration': `${duration}ms` } as React.CSSProperties}
        >
            {children}
        </span>
    );
};

export default BlurText;
