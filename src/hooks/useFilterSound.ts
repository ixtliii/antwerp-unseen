import { useRef, useCallback } from 'react';

const useFilterSound = () => {
    const ctxRef = useRef<AudioContext | null>(null);

    const play = useCallback(() => {
        if (!ctxRef.current) {
            const AudioContextClass = window.AudioContext ||
                (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (!AudioContextClass) return;
            ctxRef.current = new AudioContextClass();
        }
        const ctx = ctxRef.current;
        if (ctx.state === 'suspended') void ctx.resume();

        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
    }, []);

    return play;
};

export default useFilterSound;
