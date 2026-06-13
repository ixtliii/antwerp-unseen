import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import type { Prompt } from '../submitFlow.types';
import { PROMPTS } from '../submitFlow.types';

interface PromptStepProps {
    onSelect: (prompt: Prompt) => void;
}

const PromptStep = ({ onSelect }: PromptStepProps) => {
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
            tl.fromTo('.submit-flow__title', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 })
                .fromTo('.submit-flow__subtitle', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.3')
                .fromTo('.prompt-card',
                    { opacity: 0, y: 50, clipPath: 'inset(0 0 100% 0)' },
                    { opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)', duration: 0.7, stagger: 0.12, ease: 'expo.out' },
                    '-=0.2'
                )
                .fromTo('.prompt-card__num',
                    { opacity: 0, scale: 0.5 },
                    { opacity: 0.15, scale: 1, duration: 0.6, stagger: 0.12, ease: 'back.out(2)' },
                    '-=0.6'
                );
        }, rootRef);
        return () => ctx.revert();
    }, []);

    const handleTilt = (e: React.MouseEvent<HTMLButtonElement>) => {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        gsap.to(card, { rotateY: x * 8, rotateX: -y * 8, duration: 0.4, ease: 'power2.out', transformPerspective: 800 });
    };

    const resetTilt = (e: React.MouseEvent<HTMLButtonElement>) => {
        gsap.to(e.currentTarget, { rotateY: 0, rotateX: 0, duration: 0.6, ease: 'power3.out' });
    };

    return (
        <div className="submit-flow__screen" ref={rootRef}>
            <h1 className="submit-flow__title">ADD YOUR STORY</h1>
            <p className="submit-flow__subtitle">Pick a prompt that speaks to you</p>

            <div className="submit-flow__prompts">
                {PROMPTS.map((p) => (
                    <button
                        key={p.id}
                        type="button"
                        className="prompt-card"
                        onClick={() => onSelect(p)}
                        onMouseMove={handleTilt}
                        onMouseLeave={resetTilt}
                    >
                        <span className="prompt-card__q">Q:</span>
                        <p className="prompt-card__text">"{p.text}"</p>
                        <span className="prompt-card__num">{p.id}</span>
                        <span className="prompt-card__corner" aria-hidden />
                    </button>
                ))}
            </div>
        </div>
    );
};

export default PromptStep;