import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import './installation.css';

import { supabase } from '../../../lib/supabaseClient';
import {
    PUBLIC_BASE_URL,
    INSTALLATION_PROMPTS,
    DEFAULT_LOCATION,
    DEFAULT_PROMPT_ID,
    HIGHLIGHTED_ID,
    MOCK_CONTRIBUTIONS,
    mapSubmission,
    loadSettings,
    saveSettings,
    type Contribution,
    type VisualSettings,
    type FloatingItem,
} from './installationConfig';

import { useVoicePlayback } from '../../../hooks/useVoicePlayback';
import { useInstallationRender } from '../../../hooks/useInstallationRender';
import ContributionCard from '../../molecules/ContributionCard/ContributionCard';
import InstallationQR from '../../molecules/InstallationQR/InstallationQR';
import SettingsPanel from '../../molecules/SettingsPanel/SettingsPanel';

// QR exclusion zone (percent coords) — keep floating cards out of this box so
// they never drift over the QR at bottom-centre.
const QR_ZONE = { xMin: 32, xMax: 68, yMin: 74, yMax: 105 };

const avoidQrZone = (x: number, y: number, vyBias: number): { x: number; y: number } => {
    if (x > QR_ZONE.xMin && x < QR_ZONE.xMax && y > QR_ZONE.yMin && y < QR_ZONE.yMax) {
        // push it upward out of the zone
        return { x, y: QR_ZONE.yMin - 2 + vyBias };
    }
    return { x, y };
};

const Installation = () => {
    // --- Resolve location + prompt from URL ---
    const [searchParams] = useSearchParams();
    const locationSlug = searchParams.get('location') ?? DEFAULT_LOCATION;
    const promptId = Number(searchParams.get('prompt')) || DEFAULT_PROMPT_ID;
    const promptText = INSTALLATION_PROMPTS[promptId] ?? INSTALLATION_PROMPTS[DEFAULT_PROMPT_ID];

    const submitUrl = useMemo(() => {
        const params = new URLSearchParams({ location: locationSlug, prompt: String(promptId) });
        return `${PUBLIC_BASE_URL}/submit?${params.toString()}`;
    }, [locationSlug, promptId]);

    // --- Visual settings (persisted, Shift+D panel) ---
    const [settings, setSettings]         = useState<VisualSettings>(loadSettings);
    const [showSettings, setShowSettings] = useState(false);
    const settingsRef = useRef<VisualSettings>(loadSettings());

    useEffect(() => {
        saveSettings(settings);
        settingsRef.current = settings;
    }, [settings]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.shiftKey && e.key === 'D') setShowSettings(v => !v);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // --- GPU render pipeline (camera, segmenter, WebGL) ---
    const { videoRef, displayCanvasRef, started, startCamera } =
        useInstallationRender({ settingsRef });

    // --- Voice playback ---
    const { playVoice, stopVoice } = useVoicePlayback();

    // --- Active state ---
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        if (!isActive) { stopVoice(); return; }
        const delay = setTimeout(playVoice, 800);
        return () => { clearTimeout(delay); stopVoice(); };
    }, [isActive, playVoice, stopVoice]);

    // --- Contributions: real submissions from DB, fallback to mock ---
    const [contributions, setContributions] = useState<Contribution[]>(MOCK_CONTRIBUTIONS);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const { data, error } = await supabase
                .from('submissions')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(30);

            if (cancelled || error || !data || data.length === 0) return;

            const mapped = data
                .map((row, i) => mapSubmission(row, i))
                .filter((c): c is Contribution => c !== null);

            if (mapped.length > 0) setContributions(mapped);
        })();
        return () => { cancelled = true; };
    }, []);

    // --- Floating contributions ---
    const [floatingItems, setFloatingItems] = useState<FloatingItem[]>([]);
    const floatingRef = useRef<FloatingItem[]>([]);
    const rafFloatRef = useRef<number>(0);

    const initFloating = useCallback(() => {
        const items: FloatingItem[] = contributions.map((c) => ({
            id: c.id,
            contribution: c,
            x: -5 + Math.random() * 105,
            y: -5 + Math.random() * 75,           // start above the QR zone
            vx: 0.0011 + Math.random() * 0.0007,  // slower drift
            vy: -0.0003 + (Math.random() - 0.5) * 0.0005,
            opacity: 0,
            phaseOffset: Math.random() * Math.PI * 2,
            highlighted: c.id === HIGHLIGHTED_ID,
        }));
        floatingRef.current = items;
        setTimeout(() => setFloatingItems([...items]), 0);
        return items;
    }, [contributions]);

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
                const wave = Math.sin(t * 0.2 + fi.phaseOffset) * 0.0007;
                x += fi.vx * dt;
                y += (fi.vy + wave) * dt;
                if (x > 112) x -= 122;
                if (x < -12) x += 122;
                if (y > 108) y -= 118;
                if (y < -8)  y += 118;
                ({ x, y } = avoidQrZone(x, y, fi.vy * dt));
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

    // --- Render ---
    return (
        <div className="installation">
            <canvas ref={displayCanvasRef} className="installation__camera" />
            <video  ref={videoRef} style={{ display: 'none' }} playsInline muted />

            {!started && <div className="installation__bg" />}
            <div className="installation__grain" />

            <div className={`installation__inactive ${isActive ? 'installation__inactive--hidden' : ''}`}>
                <p className="installation__label">ANTWERP UNSEEN</p>
                <p className="installation__sublabel">THE LIVING ARCHIVE</p>
            </div>

            <div className={`installation__active ${isActive ? 'installation__active--visible' : ''}`}>
                <div className="installation__prompt">
                    <p>{promptText}</p>
                </div>

                <InstallationQR url={submitUrl} />

                {floatingItems.map(item => (
                    <div
                        key={item.id}
                        className={`installation__contribution ${item.highlighted ? 'installation__contribution--featured' : ''}`}
                        style={{ left: `${item.x}%`, top: `${item.y}%`, opacity: item.opacity }}
                    >
                        <ContributionCard item={item} />
                    </div>
                ))}
            </div>

            {showSettings && (
                <SettingsPanel settings={settings} setSettings={setSettings} />
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