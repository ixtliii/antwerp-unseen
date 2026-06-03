import { useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import BlurText from '../../atoms/BlurText/BlurText';
import Button from '../../atoms/Button/Button';
import CameraFeed from '../../molecules/CameraFeed/CameraFeed';
import useScrollReveal from '../../../hooks/useScrollReveal';
import './mapSection.css';

// Approximate neighbourhood locations — not exact GPS coords
// x/y are percentages of the map container
export interface ScreenLocation {
    id:     string;
    label:  string;
    x:      number; // % from left
    y:      number; // % from top
    stream?: string;
    thumb?:  string;
}

const MOCK_LOCATIONS: ScreenLocation[] = [
    { id: 'borgerhout',   label: 'Borgerhout',   x: 68, y: 35, thumb: 'https://picsum.photos/seed/borg/800/600' },
    { id: 'docks',        label: 'The Docks',     x: 42, y: 22, thumb: 'https://picsum.photos/seed/dock/800/600' },
    { id: 'berchem',      label: 'Berchem',       x: 55, y: 62, thumb: 'https://picsum.photos/seed/berc/800/600' },
    { id: 'antwerpen-centraal', label: 'Centraal', x: 50, y: 40, thumb: 'https://picsum.photos/seed/cent/800/600' },
    { id: 'eilandje',     label: 'Eilandje',      x: 38, y: 18, thumb: 'https://picsum.photos/seed/eila/800/600' },
    { id: 'hoboken',      label: 'Hoboken',       x: 36, y: 75, thumb: 'https://picsum.photos/seed/hobo/800/600' },
    { id: 'merksem',      label: 'Merksem',       x: 60, y: 15, thumb: 'https://picsum.photos/seed/merk/800/600' },
];

const MapSection = () => {
    const { t } = useLanguage();
    const sectionRef = useScrollReveal() as React.RefObject<HTMLElement>;

    const [activeId, setActiveId] = useState<string | null>(null);
    const [history,  setHistory]  = useState<string[]>([]);

    const activeIndex   = MOCK_LOCATIONS.findIndex(l => l.id === activeId);
    const activeLocation = MOCK_LOCATIONS[activeIndex] ?? null;

    const openLocation = (id: string) => {
        setHistory(h => activeId ? [...h, activeId] : h);
        setActiveId(id);
    };

    const goNext = () => {
        const next = MOCK_LOCATIONS[(activeIndex + 1) % MOCK_LOCATIONS.length];
        openLocation(next.id);
    };

    const goPrev = () => {
        if (history.length) {
            const prev = history[history.length - 1];
            setHistory(h => h.slice(0, -1));
            setActiveId(prev);
        }
    };

    const close = () => {
        setActiveId(null);
        setHistory([]);
    };

    return (
        <section
            className="map-section reveal-section"
            ref={sectionRef as React.RefObject<HTMLElement>}
            aria-label="Screen locations"
        >
            {/* Section header */}
            <div className="map-section__header">
                <p className="map-section__eyebrow">
                    <BlurText>{t.map.eyebrow}</BlurText>
                </p>
                <h2 className="map-section__title">
                    {t.map.title.split('\n').map((line, i) => (
                        <span key={i} className="map-section__title-line">
                            <BlurText delay={i * 120}>{line}</BlurText>
                        </span>
                    ))}
                </h2>
                <p className="map-section__subtitle">
                    <BlurText delay={300}>{t.map.subtitle}</BlurText>
                </p>
            </div>

            {/* Map */}
            <div className="map-section__map-wrap">
                {/* Antwerp SVG outline — simplified borough boundaries */}
                <div className="map-section__map" role="img" aria-label="Map of Antwerp">
                    <svg
                        className="map-section__svg"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="xMidYMid meet"
                        aria-hidden
                    >
                        {/* Rough Antwerp city outline */}
                        <path
                            d="M30 10 L45 8 L55 10 L70 12 L78 18 L82 28 L80 38 L75 48 L72 58 L68 70 L62 80 L55 88 L46 90 L38 86 L30 80 L24 72 L20 62 L18 50 L20 38 L22 26 L26 16 Z"
                            fill="none"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="0.5"
                        />
                        {/* Borough subdivisions — approximate */}
                        <path d="M38 10 L38 50 M50 8 L50 55 M30 35 L80 35 M25 55 L75 55" stroke="rgba(255,255,255,0.04)" strokeWidth="0.3" fill="none" />
                    </svg>

                    {/* Location dots */}
                    {MOCK_LOCATIONS.map(loc => (
                        <button
                            key={loc.id}
                            className={`map-section__dot${activeId === loc.id ? ' map-section__dot--active' : ''}`}
                            style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
                            onClick={() => openLocation(loc.id)}
                            aria-label={`View ${loc.label}`}
                        >
                            <span className="map-section__dot-pulse" aria-hidden />
                            <span className="map-section__dot-label">{loc.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Location detail — fullscreen overlay */}
            {activeLocation && (
                <div className="map-detail" role="dialog" aria-modal aria-label={activeLocation.label}>
                    {/* Camera feed or fallback */}
                    <div className="map-detail__feed">
                        <CameraFeed
                            src={activeLocation.stream}
                            fallbackSrc={activeLocation.thumb}
                        />
                        <div className="map-detail__feed-overlay" />
                    </div>

                    {/* Controls */}
                    <div className="map-detail__bar">
                        <Button
                            variant="text"
                            size="sm"
                            onClick={close}
                            aria-label={t.a11y.closeDetail}
                        >
                            {t.map.back}
                        </Button>

                        <span className="map-detail__label">{activeLocation.label}</span>

                        <div className="map-detail__nav">
                            <Button
                                variant="text"
                                size="sm"
                                onClick={goPrev}
                                disabled={history.length === 0}
                            >
                                {t.map.prev}
                            </Button>
                            <Button variant="text" size="sm" onClick={goNext}>
                                {t.map.next}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default MapSection;
