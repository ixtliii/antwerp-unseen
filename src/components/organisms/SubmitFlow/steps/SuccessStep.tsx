import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface SuccessStepProps {
    onReturn: () => void;
}

const SuccessStep = ({ onReturn }: SuccessStepProps) => {
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
            tl.fromTo('.success-step__eye',
                { scaleY: 0, opacity: 0 },
                { scaleY: 1, opacity: 1, duration: 0.6, ease: 'back.out(2)' }
            )
                .fromTo('.success-step__pupil', { scale: 0 }, { scale: 1, duration: 0.4, ease: 'back.out(3)' }, '-=0.2')
                .fromTo('.submit-flow__title', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.1')
                .fromTo('.submit-flow__subtitle', { opacity: 0 }, { opacity: 1, duration: 0.4 }, '-=0.3')
                .fromTo('.success-step__return', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.2');

            gsap.to('.success-step__eye', {
                scaleY: 0.1,
                duration: 0.12,
                repeat: -1,
                repeatDelay: 3.5,
                yoyo: true,
                ease: 'power1.inOut',
                delay: 1.5,
            });
        }, rootRef);
        return () => ctx.revert();
    }, []);

    return (
        <div className="submit-flow__screen submit-flow__screen--center" ref={rootRef}>
            <svg className="success-step__eye" width="64" height="40" viewBox="0 0 64 40" fill="none">
                <path d="M2 20C2 20 14 4 32 4C50 4 62 20 62 20C62 20 50 36 32 36C14 36 2 20 2 20Z" stroke="currentColor" strokeWidth="2.5" />
                <circle className="success-step__pupil" cx="32" cy="20" r="8" fill="currentColor" />
                <circle cx="32" cy="20" r="4" fill="var(--bg-dark, #080808)" />
            </svg>

            <h1 className="submit-flow__title">ANSWER SUBMITTED!</h1>
            <p className="submit-flow__subtitle">Thank you for your participation.</p>

            <button type="button" className="success-step__return" onClick={onReturn}>
                RETURN TO ARCHIVE
            </button>
        </div>
    );
};

export default SuccessStep;