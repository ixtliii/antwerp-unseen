import { useEffect, useRef, useState, useCallback, type CSSProperties } from 'react';
import type { ImageSegmenter } from '@mediapipe/tasks-vision';
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
const VOICE_FILE = '/New_Recording_44.mp3';

// --- Visual settings (persisted to localStorage, toggled with Shift+D) ---
type VisualMode = 'light-on-dark' | 'dark-on-light' | 'pixel-sort' | 'invert-smear';

interface VisualSettings {
    mode:      VisualMode;
    decay:     number;   // trail fade speed  0.01–0.20
    blur:      number;   // px blur on silhouette 0–20
    threshold: number;   // motion detection sensitivity 5–80
    grain:     number;   // grain opacity 0–0.20
    sortStrength: number; // pixel sort intensity 0–1
}

const SETTINGS_KEY = 'antwerp-unseen-visual-settings';

const DEFAULT_SETTINGS: VisualSettings = {
    mode: 'light-on-dark',
    decay: 0.035,
    blur: 0,
    threshold: 25,
    grain: 0.04,
    sortStrength: 0.5,
};

const loadSettings = (): VisualSettings => {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch { /* ignore */ }
    return { ...DEFAULT_SETTINGS };
};

const saveSettings = (s: VisualSettings) => {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* ignore */ }
};

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
    const settingsRef      = useRef<VisualSettings>(loadSettings());

    const [started, setStarted]             = useState(false);
    const [isActive, setIsActive]           = useState(false);
    const [floatingItems, setFloatingItems] = useState<FloatingItem[]>([]);
    const [showSettings, setShowSettings]   = useState(false);
    const [settings, setSettings]           = useState<VisualSettings>(loadSettings);

    // Persist settings whenever they change and keep ref in sync for renderLoop
    useEffect(() => {
        saveSettings(settings);
        settingsRef.current = settings;
    }, [settings]);

    // Shift+D toggles the settings panel
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.shiftKey && e.key === 'D') setShowSettings(v => !v);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

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

    // MediaPipe segmenter ref
    const segmenterRef = useRef<ImageSegmenter | null>(null);
    const segResultRef = useRef<Float32Array | null>(null);
    const frameCountRef = useRef(0);

    // --- Init MediaPipe segmenter ---
    const initSegmenter = useCallback(async () => {
        const { ImageSegmenter, FilesetResolver } = await import('@mediapipe/tasks-vision');
        const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );

        segmenterRef.current = await ImageSegmenter.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath:
                    'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite',
                delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            outputCategoryMask: false,
            outputConfidenceMasks: true,
        });
    }, []);

    // --- Render loop with MediaPipe segmentation ---
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

        const s = settingsRef.current;
        frameCountRef.current++;
        const fc = frameCountRef.current;

        const displayCtx = displayCanvas.getContext('2d')!;
        const processCtx = processCanvas.getContext('2d', { willReadFrequently: true })!;
        const trailCtx   = trailCanvas.getContext('2d')!;
        const bufferCtx  = bufferCanvas.getContext('2d')!;
        const w = displayCanvas.width;
        const h = displayCanvas.height;

        // --- Segmentation ---
        if (segmenterRef.current) {
            segmenterRef.current.segmentForVideo(video, performance.now(), (result) => {
                if (result.confidenceMasks?.[0]) {
                    segResultRef.current = result.confidenceMasks[0].getAsFloat32Array();
                }
            });
        }

        const mask = segResultRef.current;

        processCtx.drawImage(video, 0, 0, w, h);
        const outputFrame = processCtx.createImageData(w, h);
        const outputData  = outputFrame.data;
        const isDark = s.mode !== 'dark-on-light';

        if (mask) {
            for (let i = 0; i < mask.length; i++) {
                const conf = mask[i];
                const px   = i * 4;

                if (conf > 0.35) {
                    // Core silhouette — solid with confidence-scaled opacity
                    const val     = isDark ? 255 : 0;
                    const opacity = Math.min(220, conf * 255 * 1.15);
                    outputData[px] = outputData[px+1] = outputData[px+2] = val;
                    outputData[px+3] = opacity;
                } else if (conf > 0.06) {
                    // Edge zone — organic grain concentrated at boundary
                    const edgeness = 1 - Math.abs(conf - 0.2) / 0.2; // peaks at conf=0.2
                    if (Math.random() < edgeness * 0.22) {
                        const gVal    = isDark
                            ? Math.floor(140 + Math.random() * 115)
                            : Math.floor(Math.random() * 90);
                        const gOpacity = Math.floor(50 + Math.random() * 90);
                        outputData[px] = outputData[px+1] = outputData[px+2] = gVal;
                        outputData[px+3] = gOpacity;
                    } else {
                        outputData[px+3] = 0;
                    }
                } else {
                    outputData[px+3] = 0;
                }
            }
        }

        processCtx.putImageData(outputFrame, 0, 0);

        // --- Trail accumulation with organic drift ---
        bufferCtx.clearRect(0, 0, w, h);
        bufferCtx.drawImage(trailCanvas, 0, 0);

        // Slow Lissajous drift — the ghost breathes
        const t     = fc / 180;
        const driftX = Math.sin(t * 0.61) * 0.55;
        const driftY = Math.cos(t * 0.43) * 0.38;

        trailCtx.clearRect(0, 0, w, h);
        trailCtx.save();
        trailCtx.translate(driftX, driftY);
        trailCtx.drawImage(bufferCanvas, 0, 0);
        trailCtx.restore();

        // Fade
        trailCtx.globalCompositeOperation = 'destination-out';
        trailCtx.fillStyle = `rgba(0,0,0,${s.decay})`;
        trailCtx.fillRect(0, 0, w, h);
        trailCtx.globalCompositeOperation = 'source-over';

        // INK BLEED: wide halo pass first (low opacity, heavy blur)
        // — accumulates into a soft diffuse corona around the figure
        const haloBlur = Math.max(s.blur * 2.8, 6);
        trailCtx.filter = `blur(${haloBlur}px)`;
        trailCtx.globalAlpha = 0.38;
        trailCtx.drawImage(processCanvas, 0, 0);
        trailCtx.globalAlpha = 1;

        // Sharp core pass on top (normal blur)
        trailCtx.filter = s.blur > 0 ? `blur(${s.blur}px)` : 'none';
        trailCtx.drawImage(processCanvas, 0, 0);
        trailCtx.filter = 'none';

        // --- Composite to display ---
        // Slightly warm off-white for paper feel, cool dark for void
        displayCtx.fillStyle = s.mode === 'dark-on-light' ? '#e6e2dc' : '#060504';
        displayCtx.fillRect(0, 0, w, h);

        displayCtx.globalCompositeOperation = s.mode === 'dark-on-light' ? 'multiply' : 'screen';
        displayCtx.drawImage(trailCanvas, 0, 0);
        displayCtx.globalCompositeOperation = 'source-over';

        // Pixel sort pass
        if (s.mode === 'pixel-sort' || s.mode === 'invert-smear') {
            const imageData = displayCtx.getImageData(0, 0, w, h);
            const pd = imageData.data;
            const sortThresh = 180 - s.sortStrength * 120;
            for (let x = 0; x < w; x++) {
                let start = -1;
                for (let y = 0; y <= h; y++) {
                    const idx   = (y * w + x) * 4;
                    const lum   = y < h ? pd[idx] * 0.299 + pd[idx+1] * 0.587 + pd[idx+2] * 0.114 : 0;
                    const bright = lum > sortThresh;
                    if (bright && start === -1) { start = y; }
                    else if (!bright && start !== -1) {
                        const seg: {r:number,g:number,b:number,a:number,lum:number}[] = [];
                        for (let sy = start; sy < y; sy++) {
                            const si = (sy * w + x) * 4;
                            seg.push({ r: pd[si], g: pd[si+1], b: pd[si+2], a: pd[si+3], lum: pd[si]*0.299+pd[si+1]*0.587+pd[si+2]*0.114 });
                        }
                        seg.sort((a, b) => a.lum - b.lum);
                        seg.forEach((p, si) => {
                            const di = ((start + si) * w + x) * 4;
                            pd[di] = p.r; pd[di+1] = p.g; pd[di+2] = p.b; pd[di+3] = p.a;
                        });
                        start = -1;
                    }
                }
            }
            if (s.mode === 'invert-smear') {
                for (let j = 0; j < pd.length; j += 4) {
                    pd[j] = 255 - pd[j]; pd[j+1] = 255 - pd[j+1]; pd[j+2] = 255 - pd[j+2];
                }
            }
            displayCtx.putImageData(imageData, 0, 0);
        }

        // --- Film scratches (rare — ~0.8% of frames) ---
        if (Math.random() < 0.008) {
            displayCtx.save();
            displayCtx.strokeStyle = s.mode === 'dark-on-light'
                ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.10)';
            displayCtx.lineWidth = 0.5 + Math.random() * 0.5;
            displayCtx.beginPath();
            const sy  = Math.random() * h;
            const sx1 = Math.random() * w * 0.3;
            const sx2 = sx1 + w * (0.15 + Math.random() * 0.45);
            displayCtx.moveTo(sx1, sy + (Math.random() - 0.5) * 2);
            displayCtx.lineTo(sx2, sy + (Math.random() - 0.5) * 2);
            displayCtx.stroke();
            displayCtx.restore();
        }

        // --- Vignette ---
        const cx = w * 0.5, cy = h * 0.5;
        const vignette = displayCtx.createRadialGradient(cx, cy, h * 0.18, cx, cy, h * 0.88);
        if (s.mode === 'dark-on-light') {
            vignette.addColorStop(0, 'rgba(200,195,188,0)');
            vignette.addColorStop(1, 'rgba(30,25,20,0.42)');
        } else {
            vignette.addColorStop(0, 'rgba(0,0,0,0)');
            vignette.addColorStop(1, 'rgba(0,0,0,0.72)');
        }
        displayCtx.fillStyle = vignette;
        displayCtx.fillRect(0, 0, w, h);

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

            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
            const video  = videoRef.current!;
            video.srcObject = stream;
            await video.play();

            const source = audioCtxRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current);

            setStarted(true);
            void initSegmenter();

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

            {/* Settings panel — toggle with Shift+D, hidden from public */}
            {showSettings && (
                <div className="installation__settings">
                    <div className="installation__settings-title">
                        VISUAL SETTINGS <span style={{ opacity: 0.35 }}>Shift+D to close</span>
                    </div>
                    <div className="installation__settings-row">
                        <label>MODE</label>
                        <select value={settings.mode}
                                onChange={e => setSettings(s => ({ ...s, mode: e.target.value as VisualMode }))}>
                            <option value="light-on-dark">light on dark (glow)</option>
                            <option value="dark-on-light">dark on light (shadow)</option>
                            <option value="pixel-sort">pixel sort (smear)</option>
                            <option value="invert-smear">invert + smear</option>
                        </select>
                    </div>
                    <div className="installation__settings-row">
                        <label>TRAIL DECAY <span>{settings.decay.toFixed(3)}</span></label>
                        <input type="range" min="5" max="150" step="1"
                               value={Math.round(settings.decay * 1000)}
                               onChange={e => setSettings(s => ({ ...s, decay: parseInt(e.target.value) / 1000 }))} />
                    </div>
                    <div className="installation__settings-row">
                        <label>BLUR <span>{settings.blur}px</span></label>
                        <input type="range" min="0" max="20" step="1"
                               value={settings.blur}
                               onChange={e => setSettings(s => ({ ...s, blur: parseInt(e.target.value) }))} />
                    </div>
                    <div className="installation__settings-row">
                        <label>THRESHOLD <span>{settings.threshold}</span></label>
                        <input type="range" min="5" max="80" step="1"
                               value={settings.threshold}
                               onChange={e => setSettings(s => ({ ...s, threshold: parseInt(e.target.value) }))} />
                    </div>
                    <div className="installation__settings-row">
                        <label>GRAIN <span>{settings.grain.toFixed(2)}</span></label>
                        <input type="range" min="0" max="20" step="1"
                               value={Math.round(settings.grain * 100)}
                               onChange={e => setSettings(s => ({ ...s, grain: parseInt(e.target.value) / 100 }))} />
                    </div>
                    <div className="installation__settings-row">
                        <label>SORT STRENGTH <span>{settings.sortStrength.toFixed(1)}</span></label>
                        <input type="range" min="0" max="10" step="1"
                               value={Math.round(settings.sortStrength * 10)}
                               onChange={e => setSettings(s => ({ ...s, sortStrength: parseInt(e.target.value) / 10 }))} />
                    </div>
                    <button className="installation__settings-reset"
                            onClick={() => setSettings({ ...DEFAULT_SETTINGS })}>
                        RESET DEFAULTS
                    </button>
                </div>
            )}

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