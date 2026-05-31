import { useEffect, useRef, useState, useCallback, type CSSProperties } from 'react';
import './installation.css';

// --- Types ---
interface Contribution {
    id: number;
    type: 'voice' | 'text' | 'photo';
    text: string;
    author?: string;
    time: string;
    date: string;
    imgUrl?: string;
}

interface FloatingItem {
    id: number;
    contribution: Contribution;
    x: number;
    y: number;
    vx: number;
    vy: number;
    opacity: number;
    phaseOffset: number;
    highlighted: boolean;
}

// --- Mock contributions ---
const MOCK_CONTRIBUTIONS: Contribution[] = [
    { id: 1, type: 'voice', text: '"I stood on this exact corner when I got the best news of my life..."', author: 'A local, Borgerhout', time: '09:30AM', date: '02/05/2026' },
    { id: 2, type: 'text',  text: '"My father fixed bikes here for 30 years."', author: 'A local, Borgerhout', time: '12:00AM', date: '10/04/2026' },
    { id: 3, type: 'photo', text: '', time: '07:14AM', date: '03/05/2026', imgUrl: 'https://picsum.photos/seed/inst1/160/120' },
    { id: 4, type: 'voice', text: '"Every Friday we used to play football right here until the street changed."', author: 'Anonymous', time: '03:22PM', date: '15/04/2026' },
    { id: 5, type: 'text',  text: '"The smell of bread from that bakery is gone now. I miss it."', author: 'A neighbour', time: '08:45AM', date: '28/04/2026' },
    { id: 6, type: 'photo', text: '', time: '11:30AM', date: '01/05/2026', imgUrl: 'https://picsum.photos/seed/inst2/160/120' },
    { id: 7, type: 'voice', text: '"We used to sit here every Sunday. All of us."', author: 'Anonymous', time: '06:00PM', date: '20/04/2026' },
];

const HIGHLIGHTED_ID = 1;
const VOICE_FILE = '/recording.mp3';

// --- Build reverb impulse response ---
// duration: how long the reverb tail lasts in seconds
// decay: how quickly it fades (higher = faster fade)
const buildImpulse = (ctx: AudioContext, duration: number, decay: number): AudioBuffer => {
    const rate   = ctx.sampleRate;
    const length = Math.floor(rate * duration);
    const buffer = ctx.createBuffer(2, length, rate);
    for (let c = 0; c < 2; c++) {
        const data = buffer.getChannelData(c);
        for (let i = 0; i < length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
        }
    }
    return buffer;
};

// --- Static waveform ---
const Waveform = () => (
    <svg width="36" height="16" viewBox="0 0 36 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        {([1,4,7,10,13,16,19,22,25,28,31,34] as number[]).map((x, idx) => {
            const heights = [3,6,10,7,13,9,12,6,8,4,7,5];
            const h = heights[idx];
            return <rect key={x} x={x} y={(16-h)/2} width="1.5" height={h} fill="rgba(255,255,255,0.3)" rx="0.5"/>;
        })}
    </svg>
);

// --- Live animated waveform ---
// animationDelay inline to avoid CSS custom property linting issues
const LiveWaveform = () => (
    <div className="contribution__waveform-live">
        {Array.from({ length: 12 }).map((_, index) => (
            <span
                key={index}
                className="contribution__wave-bar"
                style={{ animationDelay: `${index * 0.065}s` } as CSSProperties}
            />
        ))}
    </div>
);

// --- Photo placeholder ---
const PhotoPlaceholder = () => (
    <svg width="100%" height="80" viewBox="0 0 160 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="160" height="80" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
        <line x1="0" y1="0" x2="160" y2="80" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
        <line x1="160" y1="0" x2="0" y2="80" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
    </svg>
);

// --- QR placeholder ---
const QRPlaceholder = () => (
    <svg width="56" height="56" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="26" height="26" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none"/>
        <rect x="8" y="8" width="14" height="14" fill="rgba(255,255,255,0.5)"/>
        <rect x="36" y="2" width="26" height="26" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none"/>
        <rect x="42" y="8" width="14" height="14" fill="rgba(255,255,255,0.5)"/>
        <rect x="2" y="36" width="26" height="26" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none"/>
        <rect x="8" y="42" width="14" height="14" fill="rgba(255,255,255,0.5)"/>
        <rect x="36" y="36" width="4" height="4" fill="rgba(255,255,255,0.5)"/>
        <rect x="44" y="36" width="4" height="4" fill="rgba(255,255,255,0.5)"/>
        <rect x="52" y="36" width="8" height="8" fill="rgba(255,255,255,0.5)"/>
        <rect x="36" y="44" width="4" height="4" fill="rgba(255,255,255,0.5)"/>
        <rect x="44" y="44" width="8" height="4" fill="rgba(255,255,255,0.5)"/>
        <rect x="36" y="52" width="4" height="8" fill="rgba(255,255,255,0.5)"/>
        <rect x="44" y="52" width="8" height="4" fill="rgba(255,255,255,0.5)"/>
        <rect x="56" y="48" width="4" height="8" fill="rgba(255,255,255,0.5)"/>
    </svg>
);

// --- Contribution card ---
interface ContributionCardProps { item: FloatingItem; }
const ContributionCard = ({ item }: ContributionCardProps) => {
    const { contribution, highlighted } = item;

    if (highlighted) {
        return (
            <div className="contribution__featured">
                <div className="contribution__featured-top">
                    <LiveWaveform />
                    <span className="contribution__now-playing">● NOW PLAYING</span>
                </div>
                <p className="contribution__featured-text">{contribution.text}</p>
                {contribution.author && (
                    <p className="contribution__featured-author">— {contribution.author}</p>
                )}
                <p className="contribution__featured-meta">{contribution.time} · {contribution.date}</p>
            </div>
        );
    }

    if (contribution.type === 'voice') {
        return (
            <div className="contribution__card">
                <Waveform />
                <p className="contribution__text">{contribution.text}</p>
                {contribution.author && <p className="contribution__author">— {contribution.author}</p>}
                <p className="contribution__meta">{contribution.time} · {contribution.date}</p>
            </div>
        );
    }
    if (contribution.type === 'text') {
        return (
            <div className="contribution__card">
                <p className="contribution__text">{contribution.text}</p>
                {contribution.author && <p className="contribution__author">— {contribution.author}</p>}
                <p className="contribution__meta">{contribution.time} · {contribution.date}</p>
            </div>
        );
    }
    return (
        <div className="contribution__card contribution__card--photo">
            {contribution.imgUrl
                ? <img src={contribution.imgUrl} alt="" />
                : <PhotoPlaceholder />
            }
            <p className="contribution__meta">{contribution.time} · {contribution.date}</p>
        </div>
    );
};

// --- Main component ---
const Installation = () => {
    const videoRef         = useRef<HTMLVideoElement>(null);
    const displayCanvasRef = useRef<HTMLCanvasElement>(null);
    const processCanvasRef = useRef<HTMLCanvasElement>(null);
    const trailCanvasRef   = useRef<HTMLCanvasElement>(null);
    const bufferCanvasRef  = useRef<HTMLCanvasElement>(null);
    const bgDataRef        = useRef<Float32Array | null>(null);
    const animFrameRef     = useRef<number>(0);
    const renderLoopRef    = useRef<() => void>(() => {});
    const audioCtxRef      = useRef<AudioContext | null>(null);
    const analyserRef      = useRef<AnalyserNode | null>(null);
    const dataArrayRef     = useRef<Uint8Array<ArrayBuffer> | null>(null);
    const floatingRef      = useRef<FloatingItem[]>([]);
    const rafFloatRef      = useRef<number>(0);
    const speechTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Web Audio API voice chain
    const voiceCtxRef      = useRef<AudioContext | null>(null);
    const voiceBufferRef   = useRef<AudioBuffer | null>(null);
    const voiceSourceRef   = useRef<AudioBufferSourceNode | null>(null);

    const [started, setStarted]             = useState(false);
    const [isActive, setIsActive]           = useState(false);
    const [floatingItems, setFloatingItems] = useState<FloatingItem[]>([]);

    // --- Load + decode voice recording on mount ---
    useEffect(() => {
        const load = async () => {
            const AudioContextClass = window.AudioContext ||
                (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (!AudioContextClass) return;

            const ctx = new AudioContextClass();
            voiceCtxRef.current = ctx;

            try {
                const res = await fetch(VOICE_FILE);
                const buf = await res.arrayBuffer();
                voiceBufferRef.current = await ctx.decodeAudioData(buf);
            } catch (err) {
                console.warn('Could not load voice file:', err);
            }
        };
        void load();

        return () => {
            voiceSourceRef.current?.stop();
            void voiceCtxRef.current?.close();
        };
    }, []);

    // Ref so playVoice can schedule itself without a circular useCallback dependency
    const playVoiceRef = useRef<() => void>(() => {});

    // --- Play voice with reverb effects ---
    const playVoice = useCallback(() => {
        const ctx    = voiceCtxRef.current;
        const buffer = voiceBufferRef.current;
        if (!ctx || !buffer) return;

        // Resume context if suspended (browser autoplay policy)
        if (ctx.state === 'suspended') void ctx.resume();

        // Stop any previous source
        try { voiceSourceRef.current?.stop(); } catch { /* already stopped */ }

        const source      = ctx.createBufferSource();
        source.buffer     = buffer;
        // Slightly slower playback — deepens pitch subtly, adds dreamlike quality
        source.playbackRate.value = 0.94;

        // Low-pass filter — removes harsh highs, makes the voice feel intimate and distant
        const lowpass     = ctx.createBiquadFilter();
        lowpass.type      = 'lowpass';
        lowpass.frequency.value = 3200;
        lowpass.Q.value   = 0.8;

        // Convolution reverb — long cathedral tail
        const convolver   = ctx.createConvolver();
        convolver.buffer  = buildImpulse(ctx, 4.2, 2.6);

        // Dry/wet mix — 30% direct, 70% reverb
        const dryGain     = ctx.createGain();
        dryGain.gain.value = 0.75;

        const wetGain     = ctx.createGain();
        wetGain.gain.value = 0.22;

        const master      = ctx.createGain();
        master.gain.value = 0.88;

        // Chain: source → lowpass → dry path   ↘
        //                         → convolver → wet path → master → out
        source.connect(lowpass);
        lowpass.connect(dryGain);
        lowpass.connect(convolver);
        convolver.connect(wetGain);
        dryGain.connect(master);
        wetGain.connect(master);
        master.connect(ctx.destination);

        source.start();
        voiceSourceRef.current = source;

        // Play once only
    }, []);

    // Keep ref in sync with latest callback
    useEffect(() => { playVoiceRef.current = playVoice; }, [playVoice]);

    // --- Start / stop voice when active state changes ---
    useEffect(() => {
        if (!isActive) {
            try { voiceSourceRef.current?.stop(); } catch { /* already stopped */ }
            voiceSourceRef.current = null;
            if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
            return;
        }

        const delay = setTimeout(playVoice, 800);
        return () => {
            clearTimeout(delay);
            try { voiceSourceRef.current?.stop(); } catch { /* already stopped */ }
            voiceSourceRef.current = null;
            if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
        };
    }, [isActive, playVoice]);

    // --- Init floating contributions ---
    const initFloating = useCallback(() => {
        const items: FloatingItem[] = MOCK_CONTRIBUTIONS.map((c) => ({
            id: c.id,
            contribution: c,
            x: -5 + Math.random() * 105,
            y: -5 + Math.random() * 105,
            vx: 0.0028 + Math.random() * 0.0018,
            vy: -0.0006 + (Math.random() - 0.5) * 0.0012,
            opacity: 0,
            phaseOffset: Math.random() * Math.PI * 2,
            highlighted: c.id === HIGHLIGHTED_ID,
        }));
        floatingRef.current = items;
        setTimeout(() => setFloatingItems([...items]), 0);
        return items;
    }, []);

    // --- Animate floating items ---
    useEffect(() => {
        if (!isActive) {
            cancelAnimationFrame(rafFloatRef.current);
            return () => { setFloatingItems([]); };
        }

        const items = initFloating();

        const timeouts: ReturnType<typeof setTimeout>[] = [];
        items.forEach((item, i) => {
            const t = setTimeout(() => {
                floatingRef.current = floatingRef.current.map(p =>
                    p.id === item.id ? { ...p, opacity: 1 } : p
                );
                setFloatingItems([...floatingRef.current]);
            }, i * 450);
            timeouts.push(t);
        });

        let last = performance.now();
        const animate = (now: number) => {
            const dt = Math.min(now - last, 32);
            last = now;
            const t = now / 1000;

            floatingRef.current = floatingRef.current.map(fi => {
                let { x, y } = fi;
                const wave = Math.sin(t * 0.2 + fi.phaseOffset) * 0.0015;
                x += fi.vx * dt;
                y += (fi.vy + wave) * dt;
                if (x > 112) x -= 122;
                if (x < -12) x += 122;
                if (y > 108) y -= 118;
                if (y < -8)  y += 118;
                return { ...fi, x, y };
            });

            setFloatingItems([...floatingRef.current]);
            rafFloatRef.current = requestAnimationFrame(animate);
        };

        rafFloatRef.current = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(rafFloatRef.current);
            timeouts.forEach(clearTimeout);
        };
    }, [isActive, initFloating]);

    // --- Canvas init ---
    const initCanvases = (video: HTMLVideoElement) => {
        const w = video.videoWidth;
        const h = video.videoHeight;
        [displayCanvasRef, processCanvasRef, trailCanvasRef, bufferCanvasRef].forEach(ref => {
            if (ref.current) { ref.current.width = w; ref.current.height = h; }
        });
    };

    // --- Render loop ---
    const renderLoop = useCallback(() => {
        const video         = videoRef.current;
        const displayCanvas = displayCanvasRef.current;
        const processCanvas = processCanvasRef.current;
        const trailCanvas   = trailCanvasRef.current;
        const bufferCanvas  = bufferCanvasRef.current;

        if (!video || !displayCanvas || !processCanvas || !trailCanvas || !bufferCanvas) return;
        if (video.readyState < 2) {
            animFrameRef.current = requestAnimationFrame(renderLoopRef.current);
            return;
        }

        const displayCtx = displayCanvas.getContext('2d')!;
        const processCtx = processCanvas.getContext('2d', { willReadFrequently: true })!;
        const trailCtx   = trailCanvas.getContext('2d')!;
        const bufferCtx  = bufferCanvas.getContext('2d')!;
        const w = displayCanvas.width;
        const h = displayCanvas.height;

        let volumeFactor = 0;
        if (analyserRef.current && dataArrayRef.current) {
            analyserRef.current.getByteFrequencyData(dataArrayRef.current);
            const vol = dataArrayRef.current.reduce((a: number, b: number) => a + b, 0) / dataArrayRef.current.length;
            volumeFactor = vol / 255;
        }

        processCtx.drawImage(video, 0, 0, w, h);
        const currentFrame = processCtx.getImageData(0, 0, w, h);
        const currentData  = currentFrame.data;

        if (!bgDataRef.current) {
            bgDataRef.current = new Float32Array(currentData.length);
            for (let i = 0; i < currentData.length; i++) bgDataRef.current[i] = currentData[i];
        }

        const bg          = bgDataRef.current;
        const outputFrame = processCtx.createImageData(w, h);
        const outputData  = outputFrame.data;

        for (let i = 0; i < currentData.length; i += 4) {
            bg[i]   = bg[i]   * 0.98 + currentData[i]   * 0.02;
            bg[i+1] = bg[i+1] * 0.98 + currentData[i+1] * 0.02;
            bg[i+2] = bg[i+2] * 0.98 + currentData[i+2] * 0.02;
            const diff = Math.abs(currentData[i] - bg[i]) + Math.abs(currentData[i+1] - bg[i+1]) + Math.abs(currentData[i+2] - bg[i+2]);
            if (diff > 25) {
                outputData[i] = outputData[i+1] = outputData[i+2] = 255;
                outputData[i+3] = 255;
            } else {
                outputData[i+3] = 0;
            }
        }

        processCtx.putImageData(outputFrame, 0, 0);
        bufferCtx.clearRect(0, 0, w, h);
        bufferCtx.drawImage(trailCanvas, 0, 0);

        trailCtx.clearRect(0, 0, w, h);
        const scaleVal = 1.002 + volumeFactor * 0.04;
        const upShift  = 1 + volumeFactor * 12;
        trailCtx.save();
        trailCtx.translate(w / 2, h / 2);
        trailCtx.scale(scaleVal, scaleVal);
        trailCtx.translate(-w / 2, -h / 2 - upShift);
        trailCtx.drawImage(bufferCanvas, 0, 0);
        trailCtx.restore();
        trailCtx.globalCompositeOperation = 'destination-out';
        trailCtx.fillStyle = 'rgba(0,0,0,0.035)';
        trailCtx.fillRect(0, 0, w, h);
        trailCtx.globalCompositeOperation = 'source-over';
        trailCtx.drawImage(processCanvas, 0, 0);

        displayCtx.drawImage(video, 0, 0, w, h);
        displayCtx.fillStyle = 'rgba(0,0,0,0.82)';
        displayCtx.fillRect(0, 0, w, h);
        displayCtx.globalCompositeOperation = 'screen';
        displayCtx.drawImage(trailCanvas, 0, 0);
        displayCtx.globalCompositeOperation = 'source-over';

        animFrameRef.current = requestAnimationFrame(renderLoopRef.current);
    }, []);

    useEffect(() => { renderLoopRef.current = renderLoop; }, [renderLoop]);

    // --- Start camera ---
    const startCamera = useCallback(async () => {
        try {
            const AudioContextClass = window.AudioContext ||
                (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (!AudioContextClass) return;
            audioCtxRef.current  = new AudioContextClass();
            analyserRef.current  = audioCtxRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
            dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount) as Uint8Array<ArrayBuffer>;

            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: true });
            const video  = videoRef.current!;
            video.srcObject = stream;
            await video.play();

            const source = audioCtxRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current);

            setStarted(true);

            const waitForVideo = () => {
                if (video.readyState >= 2 && video.videoWidth > 0) {
                    initCanvases(video);
                    renderLoopRef.current();
                } else {
                    requestAnimationFrame(waitForVideo);
                }
            };
            waitForVideo();
        } catch {
            setStarted(true);
        }
    }, []);

    useEffect(() => {
        return () => {
            cancelAnimationFrame(animFrameRef.current);
            cancelAnimationFrame(rafFloatRef.current);
            try { voiceSourceRef.current?.stop(); } catch { /* already stopped */ }
            void voiceCtxRef.current?.close();
            if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
        };
    }, []);

    return (
        <div className="installation">
            <canvas ref={displayCanvasRef} className="installation__camera" />
            <canvas ref={processCanvasRef} style={{ display: 'none' }} />
            <canvas ref={trailCanvasRef}   style={{ display: 'none' }} />
            <canvas ref={bufferCanvasRef}  style={{ display: 'none' }} />
            <video  ref={videoRef} style={{ display: 'none' }} playsInline muted />

            {!started && <div className="installation__bg" />}
            <div className="installation__grain" />

            <div className={`installation__inactive ${isActive ? 'installation__inactive--hidden' : ''}`}>
                <p className="installation__label">ANTWERP UNSEEN</p>
                <p className="installation__sublabel">THE LIVING ARCHIVE</p>
            </div>

            <div className={`installation__active ${isActive ? 'installation__active--visible' : ''}`}>
                <div className="installation__prompt">
                    <p>What happened here that the<br />street doesn't show anymore?</p>
                </div>
                <div className="installation__qr">
                    <QRPlaceholder />
                    <span>scan to share<br />your answer</span>
                </div>
                {floatingItems.map(item => (
                    <div
                        key={item.id}
                        className={`installation__contribution ${item.highlighted ? 'installation__contribution--featured' : ''}`}
                        style={{
                            left: `${item.x}%`,
                            top: `${item.y}%`,
                            opacity: item.opacity,
                        }}
                    >
                        <ContributionCard item={item} />
                    </div>
                ))}
            </div>

            <div className="installation__controls">
                {!started && (
                    <button className="installation__btn" onClick={startCamera}>
                        Start Camera
                    </button>
                )}
                <button
                    className={`installation__btn ${isActive ? 'installation__btn--active' : ''}`}
                    onClick={() => setIsActive(v => !v)}
                >
                    {isActive ? 'Deactivate' : 'Activate'}
                </button>
            </div>
        </div>
    );
};

export default Installation;