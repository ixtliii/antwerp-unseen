import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import './installation.css';

import { supabase } from '../../../lib/supabaseClient';
import {
    PUBLIC_BASE_URL,
    INSTALLATION_PROMPTS,
    DEFAULT_LOCATION,
    DEFAULT_PROMPT_ID,
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



const Installation = () => {
    const [searchParams] = useSearchParams();
    const locationSlug = searchParams.get('location') ?? DEFAULT_LOCATION;
    const promptId = Number(searchParams.get('prompt')) || DEFAULT_PROMPT_ID;
    const promptText = INSTALLATION_PROMPTS[promptId] ?? INSTALLATION_PROMPTS[DEFAULT_PROMPT_ID];

    const submitUrl = useMemo(() => {
        const params = new URLSearchParams({ location: locationSlug, prompt: String(promptId) });
        return `${PUBLIC_BASE_URL}/submit?${params.toString()}`;
    }, [locationSlug, promptId]);

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

    const { videoRef, displayCanvasRef, started, startCamera } =
        useInstallationRender({ settingsRef });

    // --- Auto-start the camera on mount (installation runs unattended) ---
    useEffect(() => {
        startCamera();
    }, [startCamera]);

    // --- Voice playback ---
    const { playVoice, stopVoice } = useVoicePlayback();

    // --- Active state ---
    const [isActive, setIsActive] = useState(false);

    // --- Fullscreen (hide browser chrome) ---
    const enterFullscreen = useCallback(() => {
        const el = document.documentElement as HTMLElement & {
            webkitRequestFullscreen?: () => Promise<void>;
        };
        const doc = document as Document & {
            webkitFullscreenElement?: Element;
            webkitExitFullscreen?: () => Promise<void>;
        };
        const isFs = document.fullscreenElement || doc.webkitFullscreenElement;
        if (isFs) {
            (document.exitFullscreen ?? doc.webkitExitFullscreen)?.call(document)?.catch?.(() => {});
        } else {
            (el.requestFullscreen ?? el.webkitRequestFullscreen)?.call(el)?.catch?.(() => {});
        }
    }, []);

    // --- Auto-activate once the camera is running ---
    useEffect(() => {
        if (started) setIsActive(true);
    }, [started]);

    useEffect(() => {
        if (!isActive) { stopVoice(); return; }
        const delay = setTimeout(playVoice, 800);
        return () => { clearTimeout(delay); stopVoice(); };
    }, [isActive, playVoice, stopVoice]);

    // --- Floating contributions (incremental: add/remove, never full reset) ---
    const [floatingItems, setFloatingItems] = useState<FloatingItem[]>([]);
    const floatingRef = useRef<FloatingItem[]>([]);
    const rafFloatRef = useRef<number>(0);
    const seenIds = useRef<Set<string | number>>(new Set());
    const audioCtxRef = useRef<AudioContext | null>(null);

    // soft chime when a new submission arrives
    const playArrivalSound = useCallback(() => {
        try {
            if (!audioCtxRef.current) {
                const Ctx = window.AudioContext ||
                    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
                if (!Ctx) return;
                audioCtxRef.current = new Ctx();
            }
            const ctx = audioCtxRef.current;
            if (ctx.state === 'suspended') ctx.resume().catch(() => {});

            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, now);          // C5
            osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.18); // G5
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.12, now + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
            osc.start(now);
            osc.stop(now + 0.9);
        } catch { /* ignore */ }
    }, []);

    const spawnItem = useCallback((c: Contribution, fadeIn: boolean): FloatingItem => ({
        id: c.id,
        contribution: c,
        x: -10 + Math.random() * 120,
        y: 4 + Math.random() * 62,
        vx: (Math.random() < 0.5 ? -1 : 1) * (0.0016 + Math.random() * 0.0012),
        vy: (Math.random() < 0.5 ? -1 : 1) * (0.0011 + Math.random() * 0.0009),
        opacity: fadeIn ? 0 : 0,
        phaseOffset: Math.random() * Math.PI * 2,
        highlighted: false,
    }), []);

    // initial load + realtime add/remove
    useEffect(() => {
        let cancelled = false;

        const fadeTo = (id: string | number, target: number) => {
            const step = () => {
                const item = floatingRef.current.find(f => f.id === id);
                if (!item) return;
                const diff = target - item.opacity;
                if (Math.abs(diff) < 0.02) {
                    item.opacity = target;
                } else {
                    item.opacity += diff * 0.08;
                    requestAnimationFrame(step);
                }
                setFloatingItems(floatingRef.current.map(f => ({ ...f })));
            };
            step();
        };

        // actually create + animate a card (assumes id already reserved)
        const addContributionReserved = (c: Contribution, withSound: boolean, isNew: boolean) => {
            const item = spawnItem(c, true);
            item.isNew = isNew;
            floatingRef.current = [...floatingRef.current, item];
            setFloatingItems(floatingRef.current.map(f => ({ ...f })));
            if (withSound) playArrivalSound();
            fadeTo(c.id, 1);

            if (isNew) {
                // clear the entrance flag once the animation has played
                setTimeout(() => {
                    const it = floatingRef.current.find(f => f.id === c.id);
                    if (it) {
                        it.isNew = false;
                        setFloatingItems(floatingRef.current.map(f => ({ ...f })));
                    }
                }, 2200);
            }
        };

        // realtime path: reserve first, bail if already present
        const addContribution = (c: Contribution, withSound: boolean) => {
            if (seenIds.current.has(c.id)) return;
            seenIds.current.add(c.id);
            addContributionReserved(c, withSound, true);
        };

        const removeContribution = (id: string | number) => {
            if (!seenIds.current.has(id)) return;
            fadeTo(id, 0);
            setTimeout(() => {
                floatingRef.current = floatingRef.current.filter(f => f.id !== id);
                seenIds.current.delete(id);
                setFloatingItems(floatingRef.current.map(f => ({ ...f })));
            }, 700);
        };

        const loadInitial = async () => {
            const { data, error } = await supabase
                .from('submissions')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(30);

            const source = (!error && data && data.length > 0)
                ? data.map((row, i) => mapSubmission(row, i)).filter((c): c is Contribution => c !== null)
                : MOCK_CONTRIBUTIONS;

            if (cancelled) return;
            // stagger the initial fade-in. Reserve each id synchronously here so a
            // duplicate effect run or an early realtime event can't add it twice.
            source.forEach((c, i) => {
                if (seenIds.current.has(c.id)) return;
                seenIds.current.add(c.id);
                setTimeout(() => { if (!cancelled) addContributionReserved(c, false, false); }, i * 220);
            });
        };

        loadInitial();

        const subscription = supabase
            .channel('submissions_changes')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'submissions' },
                (payload) => {
                    const c = mapSubmission(payload.new, 0);
                    if (c) addContribution(c, true);
                })
            .on('postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'submissions' },
                (payload) => {
                    const oldId = (payload.old as { id?: string | number })?.id;
                    if (oldId !== undefined) removeContribution(oldId);
                })
            .subscribe();

        return () => {
            cancelled = true;
            supabase.removeChannel(subscription);
            seenIds.current.clear();
            floatingRef.current = [];
        };
    }, [spawnItem, playArrivalSound]);

    useEffect(() => {
        if (!isActive) {
            cancelAnimationFrame(rafFloatRef.current);
            return;
        }

        let last = performance.now();

        // Cards drift past the screen edges and re-enter from the opposite side.
        // Travel band is kept above the bottom QR zone (yWrap caps at ~70%).
        const PAD = 18;            // how far past the edge (%) before wrapping
        const Y_FLOOR = 70;        // keep cards above the QR at bottom-centre
        const SEP_DIST = 22;       // min separation (%) before cards push apart
        const SEP_FORCE = 0.015;   // how hard they push apart

        const animate = (now: number) => {
            const dt = Math.min(now - last, 32);
            last = now;
            const t = now / 1000;

            const arr = floatingRef.current;

            // 1) drift + gentle wave + wrap around the (extended) screen
            for (const fi of arr) {
                const wave = Math.sin(t * 0.1 + fi.phaseOffset) * 0.0006;
                fi.x += fi.vx * dt;
                fi.y += (fi.vy + wave) * dt;

                if (fi.x < -PAD) fi.x = 100 + PAD;
                if (fi.x > 100 + PAD) fi.x = -PAD;
                if (fi.y < -PAD) fi.y = Y_FLOOR;
                if (fi.y > Y_FLOOR + PAD) fi.y = -PAD;
            }

            // 2) separation — push apart any two cards that are too close
            for (let i = 0; i < arr.length; i++) {
                for (let j = i + 1; j < arr.length; j++) {
                    const a = arr[i], b = arr[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    if (d > 0 && d < SEP_DIST) {
                        const push = (SEP_DIST - d) * SEP_FORCE;
                        const nx = (dx / d) * push;
                        const ny = (dy / d) * push;
                        a.x += nx; a.y += ny;
                        b.x -= nx; b.y -= ny;
                    }
                }
            }

            setFloatingItems(arr.map(fi => ({ ...fi })));
            rafFloatRef.current = requestAnimationFrame(animate);
        };

        rafFloatRef.current = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(rafFloatRef.current);
        };
    }, [isActive]);

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
                        className={`installation__contribution ${item.highlighted ? 'installation__contribution--featured' : ''} ${item.isNew ? 'installation__contribution--new' : ''}`}
                        style={{ left: `${item.x}%`, top: `${item.y}%`, opacity: item.opacity }}
                    >
                        {item.isNew && (
                            <span className="installation__spark" aria-hidden>
                                <span className="installation__spark-glint" />
                                {Array.from({ length: 8 }).map((_, k) => (
                                    <span key={k} className={`installation__spark-dot installation__spark-dot--${k}`} />
                                ))}
                            </span>
                        )}
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
                <button className="installation__btn" onClick={enterFullscreen}>
                    Fullscreen
                </button>
            </div>
        </div>
    );
};

export default Installation;