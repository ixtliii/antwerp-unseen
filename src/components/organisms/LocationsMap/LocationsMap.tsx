import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { LOCATIONS, MAP_W, MAP_H } from '../../../data/locations';
import MapNode from '../../molecules/MapNode/MapNode';
import './locationsMap.css';

interface LocationsMapProps {
    onSelect: (slug: string) => void;
}

const EYE = { left: 499, top: 196, width: 298, height: 168 };

const LocationsMap = ({ onSelect }: LocationsMapProps) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const mouse = useRef({ x: 0, y: 0 });
    const [scale, setScale] = useState(1);

    useLayoutEffect(() => {
        const resize = () => {
            if (!rootRef.current) return;
            const { clientWidth: w, clientHeight: h } = rootRef.current;
            const fit = Math.min(w / MAP_W, h / MAP_H) * 0.88;
            setScale(Math.min(fit, 1));
        };
        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, []);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
            tl.fromTo('.locations-map__title', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7 })
                .fromTo('.locations-map__eye', { opacity: 0, scaleY: 0.2 }, { opacity: 1, scaleY: 1, duration: 0.9, ease: 'back.out(1.6)' }, '-=0.3')
                .fromTo('.locations-map__line', { opacity: 0 }, { opacity: 1, duration: 0.9, stagger: 0.12 }, '-=0.4')
                .fromTo('.map-node__layer-wrap', { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.7, stagger: 0.05, ease: 'back.out(1.4)' }, '-=0.7')
                .fromTo('.locations-map__marker, .locations-map__label', { opacity: 0 }, { opacity: 1, duration: 0.5, stagger: 0.04 }, '-=0.5');

            const onMove = (e: MouseEvent) => {
                mouse.current.x = e.clientX / window.innerWidth - 0.5;
                mouse.current.y = e.clientY / window.innerHeight - 0.5;
                gsap.to('.locations-map__pupil', {
                    x: mouse.current.x * 18,
                    y: mouse.current.y * 12,
                    duration: 1.2,
                    ease: 'power2.out',
                });
            };
            window.addEventListener('mousemove', onMove);
            return () => window.removeEventListener('mousemove', onMove);
        }, rootRef);
        return () => ctx.revert();
    }, []);

    return (
        <div className="locations-map" ref={rootRef}>
            <h1 className="locations-map__title">FIVE SPOTS. ONE CITY. THE SCREENS ARE WAITING.</h1>

            <div
                className="locations-map__stage"
                style={{ width: MAP_W, height: MAP_H, transform: `translate(-50%, -50%) scale(${scale})` }}
            >
                {/* connector lines */}
                {LOCATIONS.map((loc) => (
                    <img
                        key={`line-${loc.slug}`}
                        src={loc.line.src}
                        alt=""
                        className="locations-map__line"
                        style={{ left: loc.line.left, top: loc.line.top, width: loc.line.width, height: loc.line.height }}
                        aria-hidden
                    />
                ))}

                {/* central eye — pinned to exact Figma px */}
                <div
                    className="locations-map__eye"
                    style={{ left: EYE.left, top: EYE.top, width: EYE.width, height: EYE.height }}
                >
                    <svg viewBox="0 0 240 140" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
                        <defs>
                            <clipPath id="eyeClip">
                                <path d="M4 70C4 70 50 8 120 8C190 8 236 70 236 70C236 70 190 132 120 132C50 132 4 70 4 70Z" />
                            </clipPath>
                        </defs>
                        <path d="M4 70C4 70 50 8 120 8C190 8 236 70 236 70C236 70 190 132 120 132C50 132 4 70 4 70Z" fill="#f0ede8" />
                        <circle className="locations-map__pupil" cx="120" cy="70" r="34" fill="#0a0a0a" clipPath="url(#eyeClip)" />
                        <circle cx="132" cy="58" r="8" fill="#f0ede8" opacity="0.9" />
                    </svg>
                </div>

                {/* location scenes */}
                {LOCATIONS.map((loc, i) => (
                    <MapNode key={loc.slug} location={loc} index={i} mouse={mouse} onSelect={onSelect} />
                ))}

                {/* markers + labels */}
                {LOCATIONS.map((loc) => (
                    <div key={`meta-${loc.slug}`}>
                        <span
                            className="locations-map__marker"
                            style={{ left: loc.marker.left, top: loc.marker.top }}
                            aria-hidden
                        />
                        <button
                            type="button"
                            className="locations-map__label"
                            style={{ left: loc.label.left, top: loc.label.top }}
                            onClick={() => onSelect(loc.slug)}
                        >
                            {loc.name}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LocationsMap;