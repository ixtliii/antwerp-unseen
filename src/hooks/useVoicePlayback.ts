import { useCallback, useEffect, useRef } from 'react';
import { VOICE_FILE, buildImpulse } from '../components/organisms/Installation/installationConfig.ts';


export const useVoicePlayback = () => {
    const ctxRef    = useRef<AudioContext | null>(null);
    const bufferRef = useRef<AudioBuffer | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);

    useEffect(() => {
        const load = async () => {
            const AudioContextClass = window.AudioContext ||
                (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (!AudioContextClass) return;

            const ctx = new AudioContextClass();
            ctxRef.current = ctx;

            try {
                const res = await fetch(VOICE_FILE);
                const buf = await res.arrayBuffer();
                bufferRef.current = await ctx.decodeAudioData(buf);
            } catch (err) {
                console.warn('Could not load voice file:', err);
            }
        };
        void load();

        return () => {
            try { sourceRef.current?.stop(); } catch { /* already stopped */ }
            void ctxRef.current?.close();
        };
    }, []);

    const stopVoice = useCallback(() => {
        try { sourceRef.current?.stop(); } catch { /* already stopped */ }
        sourceRef.current = null;
    }, []);

    const playVoice = useCallback(() => {
        const ctx    = ctxRef.current;
        const buffer = bufferRef.current;
        if (!ctx || !buffer) return;

        if (ctx.state === 'suspended') void ctx.resume();
        try { sourceRef.current?.stop(); } catch { /* already stopped */ }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = 0.94;

        const lowpass = ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 3200;
        lowpass.Q.value = 0.8;

        const convolver = ctx.createConvolver();
        convolver.buffer = buildImpulse(ctx, 4.2, 2.6);

        const dryGain = ctx.createGain();
        dryGain.gain.value = 0.75;

        const wetGain = ctx.createGain();
        wetGain.gain.value = 0.22;

        const master = ctx.createGain();
        master.gain.value = 0.88;

        source.connect(lowpass);
        lowpass.connect(dryGain);
        lowpass.connect(convolver);
        convolver.connect(wetGain);
        dryGain.connect(master);
        wetGain.connect(master);
        master.connect(ctx.destination);

        source.start();
        sourceRef.current = source;
    }, []);

    return { playVoice, stopVoice };
};

export default useVoicePlayback;