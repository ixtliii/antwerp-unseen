import type { Format } from '../submitFlow.types';

interface FormatSwitcherProps {
    active: Format;
    onSwitch: (format: Format) => void;
}

const FORMATS: { id: Format; label: string }[] = [
    { id: 'text',  label: 'Text'  },
    { id: 'voice', label: 'Voice' },
    { id: 'image', label: 'Image' },
    { id: 'video', label: 'Video' },
];

const ICONS: Record<Format, React.ReactNode> = {
    text: (
        <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
            <rect x="6" y="6" width="36" height="36" rx="3" stroke="currentColor" strokeWidth="2.5" />
            <text x="24" y="33" textAnchor="middle" fontSize="22" fontWeight="bold" fill="currentColor" fontFamily="serif">A</text>
        </svg>
    ),
    voice: (
        <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
            <rect x="17" y="4" width="14" height="24" rx="7" stroke="currentColor" strokeWidth="2.5" />
            <path d="M8 26c0 8.837 7.163 16 16 16s16-7.163 16-16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="24" y1="42" x2="24" y2="48" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
    ),
    image: (
        <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
            <rect x="4" y="8" width="40" height="32" rx="3" stroke="currentColor" strokeWidth="2.5" />
            <circle cx="15" cy="19" r="4" stroke="currentColor" strokeWidth="2.5" />
            <path d="M4 34l10-10 8 8 6-6 16 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    video: (
        <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
            <rect x="4" y="8" width="28" height="32" rx="3" stroke="currentColor" strokeWidth="2.5" />
            <path d="M32 18l12-6v24l-12-6V18z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        </svg>
    ),
};

const FormatSwitcher = ({ active, onSwitch }: FormatSwitcherProps) => (
    <div className="format-switcher" role="tablist" aria-label="Switch format">
        {FORMATS.map((f) => (
            <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={f.id === active}
                className={`format-switcher__btn ${f.id === active ? 'is-active' : ''}`}
                onClick={() => f.id !== active && onSwitch(f.id)}
            >
                <span className="format-switcher__icon">{ICONS[f.id]}</span>
                <span className="format-switcher__label">{f.label}</span>
            </button>
        ))}
    </div>
);

export default FormatSwitcher;