import { useEffect, useRef } from 'react';
import gsap from 'gsap';

let audioCtx: AudioContext | null = null;

const initAudio = () => {
    if (!audioCtx) {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        audioCtx = new Ctx();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
};

const pathText = () => {
    const ctx = initAudio();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'square';
    osc.frequency.setValueAtTime(450 + Math.random() * 150, ctx.currentTime);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.015, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
};

const ChoosePathText = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const text = "Choose your path...";

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.to('.path-char', {
                opacity: 1,
                duration: 0.01,
                stagger: {
                    amount: 1.5,
                    from: "random",
                    onStart: pathText
                }
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <div className="choose-path-wrapper" ref={containerRef}>
            {text.split('').map((char, i) => (
                <span
                    key={i}
                    className="path-char"
                    style={{ opacity: 0, display: 'inline-block' }}
                >
                    {char === ' ' ? '\u00A0' : char}
                </span>
            ))}
        </div>
    );
};

export default ChoosePathText;