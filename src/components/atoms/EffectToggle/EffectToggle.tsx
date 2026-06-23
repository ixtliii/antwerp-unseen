import { useEffect, useState } from 'react';
import './effectToggle.css';

const STORAGE_KEY = 'au_dither_enabled';

export const readDitherPref = (): boolean => {
    if (typeof window === 'undefined') return true;
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === null ? true : v === 'true';
};

interface EffectToggleProps {
    enabled: boolean;
    onChange: (enabled: boolean) => void;
}

const EffectToggle = ({ enabled, onChange }: EffectToggleProps) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const handle = () => {
        const next = !enabled;
        window.localStorage.setItem(STORAGE_KEY, String(next));
        onChange(next);
    };

    return (
        <div className="effect-toggle">
            <span className="effect-toggle__text">
                <span className="effect-toggle__label">Dither effect</span>
                <span className="effect-toggle__state">{enabled ? 'On' : 'Off'}</span>
            </span>
            <button
                type="button"
                role="switch"
                aria-checked={enabled}
                aria-label="Toggle dither effect"
                className={`effect-toggle__switch ${enabled ? 'is-on' : ''} ${mounted ? 'is-mounted' : ''}`}
                onClick={handle}
            >
                <span className="effect-toggle__knob" />
            </button>
        </div>
    );
};

export default EffectToggle;