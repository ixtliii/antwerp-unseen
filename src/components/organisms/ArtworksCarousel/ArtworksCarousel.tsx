import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import BlurText from '../../atoms/BlurText/BlurText';
import Button from '../../atoms/Button/Button';
import './artworksCarousel.css';

interface Artwork {
    id:    string;
    url:   string;
    type:  'photo' | 'text' | 'voice';
    date:  string;
    label: string;
}

const MOCK_ARTWORKS: Artwork[] = [
    { id: '1', url: 'https://picsum.photos/seed/aw1/400/300', type: 'photo', date: '2026-05-02', label: 'Silhouette, Borgerhout' },
    { id: '2', url: 'https://picsum.photos/seed/aw2/400/300', type: 'photo', date: '2026-05-05', label: 'Evening, Berchem' },
    { id: '3', url: 'https://picsum.photos/seed/aw3/400/300', type: 'photo', date: '2026-05-09', label: 'Rain, Docks' },
    { id: '4', url: 'https://picsum.photos/seed/aw4/400/300', type: 'photo', date: '2026-05-12', label: 'Morning, Eilandje' },
    { id: '5', url: 'https://picsum.photos/seed/aw5/400/300', type: 'photo', date: '2026-05-18', label: 'Still, Centraal' },
    { id: '6', url: 'https://picsum.photos/seed/aw6/400/300', type: 'photo', date: '2026-05-22', label: 'Dusk, Merksem' },
];

const ArtworksCarousel = () => {
    const { t } = useLanguage();
    const sectionRef = useRef<HTMLElement>(null);
    const [active, setActive] = useState(0);
    const [started, setStarted] = useState(false);
    const rafRef = useRef<number>(0);
    const angleRef = useRef(0);

    const TOTAL  = MOCK_ARTWORKS.length;
    const RADIUS = 320; // px — desktop. Scaled via CSS on mobile

    // Scroll-triggered auto-rotation
    useEffect(() => {
        const el = sectionRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setStarted(true); },
            { threshold: 0.25 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!started) return;
        let last = performance.now();

        const tick = (now: number) => {
            const dt = now - last; last = now;
            angleRef.current += dt * 0.012; // degrees per ms
            const snapped = Math.round(angleRef.current / (360 / TOTAL));
            setActive(((snapped % TOTAL) + TOTAL) % TOTAL);
            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, [started, TOTAL]);

    return (
        <section className="artworks" ref={sectionRef} aria-label="Archive artworks">
            <div className="artworks__header">
                <p className="artworks__eyebrow">
                    <BlurText>{t.artworks.eyebrow}</BlurText>
                </p>
                <h2 className="artworks__title">
                    {t.artworks.title.split('\n').map((line, i) => (
                        <span key={i} className="artworks__title-line">
                            <BlurText delay={i * 120}>{line}</BlurText>
                        </span>
                    ))}
                </h2>
            </div>

            {/* Circular carousel */}
            <div className="artworks__stage" aria-label="Artwork carousel">
                <div
                    className="artworks__ring"
                    style={{ '--radius': `${RADIUS}px`, '--total': TOTAL } as React.CSSProperties}
                >
                    {MOCK_ARTWORKS.map((art, i) => {
                        const deg = (360 / TOTAL) * i - angleRef.current;
                        const isActive = i === active;
                        return (
                            <Link
                                key={art.id}
                                to="/explore"
                                className={`artworks__card${isActive ? ' artworks__card--active' : ''}`}
                                style={{
                                    '--deg': `${deg}deg`,
                                    '--radius': `${RADIUS}px`,
                                } as React.CSSProperties}
                                aria-label={art.label}
                            >
                                <img src={art.url} alt={art.label} loading="lazy" />
                                <div className="artworks__card-label">
                                    <span>{art.label}</span>
                                    <time dateTime={art.date}>{art.date}</time>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>

            <div className="artworks__cta">
                <BlurText delay={400}>
                    <Button as="a" href="/explore" variant="ghost" size="md">
                        {t.artworks.cta}
                    </Button>
                </BlurText>
            </div>
        </section>
    );
};

export default ArtworksCarousel;
