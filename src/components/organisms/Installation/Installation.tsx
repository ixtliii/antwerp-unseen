import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import './installation.css';

import {
    PUBLIC_BASE_URL,
    INSTALLATION_PROMPTS,
    DEFAULT_LOCATION,
    DEFAULT_PROMPT_ID,
    HIGHLIGHTED_ID,
    MOCK_CONTRIBUTIONS,
    loadSettings,
    saveSettings,
    type VisualSettings,
    type FloatingItem,
} from './installationConfig';

import { useVoicePlayback } from '../../../hooks/useVoicePlayback';
import { useInstallationRender } from '../../../hooks/useInstallationRender';
import ContributionCard from '../../molecules/ContributionCard/ContributionCard';
import InstallationQR from '../../molecules/InstallationQR/InstallationQR';
import SettingsPanel from '../../molecules/SettingsPanel/SettingsPanel';

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

    // --- Floating contributions ---
    const [floatingItems, setFloatingItems] = useState<FloatingItem[]>([]);
    const floatingRef = useRef<FloatingItem[]>([]);
    const rafFloatRef = useRef<number>(0);

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