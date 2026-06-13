import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import type { Format, Prompt } from '../submitFlow.types';

interface FormatStepProps {
    prompt: Prompt;
    onSelectFormat: (format: Format) => void;
    onClearPrompt: () => void;
}

const FORMATS: { id: Format; label: string }[] = [
    { id: 'text', label: 'Text' },
    { id: 'voice', label: 'Voice' },
    { id: 'image', label: 'Image' },
    { id: 'video', label: 'Video' },
];

const ICONS: Record<Format, React.ReactNode> = {
    text: (
        <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
            <rect x="4" y="4" width="40" height="40" rx="4" stroke="currentColor" strokeWidth="2" />
            <text x="24" y="32" textAnchor="middle" fontSize="20" fontWeight="bold" fill="currentColor" fontFamily="serif">A</text>
        </svg>
    ),
    voice: (
        <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
            <rect x="17" y="4" width="14" height="24" rx="7" stroke="currentColor" strokeWidth="2" />
            <path d="M8 26c0 8.837 7.163 16 16 16s16-7.163 16-16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="24" y1="42" x2="24" y2="48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    ),
    image: (
        <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
            <rect x="4" y="8" width="40" height="32" rx="3" stroke="currentColor" strokeWidth="2" />
            <circle cx="15" cy="19" r="4" stroke="currentColor" strokeWidth="2" />
            <path d="M4 34l10-10 8 8 6-6 16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    video: (
        <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
            <rect x="4" y="8" width="28" height="32" rx="3" stroke="currentColor" strokeWidth="2" />
            <path d="M32 18l12-6v24l-12-6V18z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
    ),
};

const FormatStep = ({ prompt, onSelectFormat, onClearPrompt }: FormatStepProps) => {
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
            tl.fromTo('.submit-flow__title', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })
                .fromTo('.format-step__prompt',
                    { clipPath: 'inset(0 100% 0 0)', opacity: 0 },
                    { clipPath: 'inset(0 0% 0 0)', opacity: 1, duration: 0.7, ease: 'power4.inOut' },
                    '-=0.2'
                )
                .fromTo('.submit-flow__subtitle', { opacity: 0 }, { opacity: 1, duration: 0.4 }, '-=0.2')
                .fromTo('.format-step__btn',
                    { opacity: 0, y: 30, scale: 0.8 },
                    { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: 'back.out(1.7)' },
                    '-=0.2'
                );

            gsap.to('.format-step__dot', {
                scale: 1.3,
                opacity: 0.6,
                duration: 1.2,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
                stagger: 0.2,
            });
        }, rootRef);
        return () => ctx.revert();
    }, []);

    return (
        <div className="submit-flow__screen" ref={rootRef}>
            <h1 className="submit-flow__title">ADD YOUR STORY</h1>

            <div className="format-step__prompt">
                <p>"{prompt.text}"</p>
                <button type="button" className="format-step__clear" onClick={onClearPrompt} aria-label="Clear prompt">
                    ×
                </button>
            </div>

            <p className="submit-flow__subtitle">How do you want to share it?</p>

            <div className="format-step__grid">
                {FORMATS.map((f) => (
                    <button key={f.id} type="button" className="format-step__btn" onClick={() => onSelectFormat(f.id)}>
                        <span className="format-step__icon">{ICONS[f.id]}</span>
                        <span className="format-step__label">{f.label}</span>
                        <span className="format-step__dot" aria-hidden />
                    </button>
                ))}
            </div>
        </div>
    );
};

export default FormatStep;