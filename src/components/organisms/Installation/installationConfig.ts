// ── installationConfig.ts ───────────────────────────────────────────────────
// Per-installation config + visual settings types/persistence.

export const PUBLIC_BASE_URL = 'https://antwerp-unseen.vercel.app';

export const INSTALLATION_PROMPTS: Record<number, string> = {
    1: 'When was the last time you felt alive in the city?',
    2: "What happened here that the street doesn't show anymore?",
    3: 'What keeps you moving on through here everyday?',
};

export const DEFAULT_LOCATION = 'borgerhout';
export const DEFAULT_PROMPT_ID = 2;

export const HIGHLIGHTED_ID = 1;
export const VOICE_FILE = '/New_Recording_44.mp3';

// --- Contribution types ---
export interface Contribution {
    id: number;
    type: 'voice' | 'text' | 'photo';
    text: string;
    author?: string;
    time: string;
    date: string;
    imgUrl?: string;
}

export interface FloatingItem {
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

export interface Particle {
    x: number; y: number; vx: number; vy: number;
    size: number; opacity: number; life: number; maxLife: number;
}

export const MOCK_CONTRIBUTIONS: Contribution[] = [
    { id: 1, type: 'voice', text: '"I stood on this exact corner when I got the best news of my life..."', author: 'A local, Borgerhout', time: '09:30AM', date: '02/05/2026' },
    { id: 2, type: 'text',  text: '"My father fixed bikes here for 30 years."', author: 'A local, Borgerhout', time: '12:00AM', date: '10/04/2026' },
    { id: 3, type: 'photo', text: '', time: '07:14AM', date: '03/05/2026', imgUrl: 'https://picsum.photos/seed/inst1/160/120' },
    { id: 4, type: 'voice', text: '"Every Friday we used to play football right here until the street changed."', author: 'Anonymous', time: '03:22PM', date: '15/04/2026' },
    { id: 5, type: 'text',  text: '"The smell of bread from that bakery is gone now. I miss it."', author: 'A neighbour', time: '08:45AM', date: '28/04/2026' },
    { id: 6, type: 'photo', text: '', time: '11:30AM', date: '01/05/2026', imgUrl: 'https://picsum.photos/seed/inst2/160/120' },
    { id: 7, type: 'voice', text: '"We used to sit here every Sunday. All of us."', author: 'Anonymous', time: '06:00PM', date: '20/04/2026' },
];

// --- Visual settings (persisted, Shift+D) ---
export type VisualMode = 'light-on-dark' | 'dark-on-light';
export type DitherStyle = 'none' | 'bayer-dots' | 'cross-hatch' | 'blocky';

export interface VisualSettings {
    mode:         VisualMode;
    ditherStyle:  DitherStyle;
    ditherScale:  number;   // base dither cell px (2–14)
    depth:        number;   // multi-scale layering (0–1)
    dotGrow:      number;   // tonal dot softness (0–1)
    breathe:      number;   // slow pulse (0–1)
    smoothing:    number;   // temporal mask smoothing (0–1) — higher = more stable, more lag
    glitch:       number;   // edge displacement (0–1)
    warp:         number;   // feedback smoke-warp (0–1)
    decay:        number;   // trail fade per frame (0.005–0.15)
    grain:        number;   // film grain (0–0.20)
}

const SETTINGS_KEY = 'antwerp-unseen-visual-settings';

export const DEFAULT_SETTINGS: VisualSettings = {
    mode: 'light-on-dark',
    ditherStyle: 'bayer-dots',
    ditherScale: 7,
    depth: 0.6,
    dotGrow: 0.7,
    breathe: 0.4,
    smoothing: 0.7,
    glitch: 0.25,
    warp: 0.5,
    decay: 0.05,
    grain: 0.05,
};

export const loadSettings = (): VisualSettings => {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch { /* ignore */ }
    return { ...DEFAULT_SETTINGS };
};

export const saveSettings = (s: VisualSettings) => {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* ignore */ }
};

// --- Reverb impulse builder (used by useVoicePlayback) ---
export const buildImpulse = (ctx: AudioContext, duration: number, decay: number): AudioBuffer => {
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