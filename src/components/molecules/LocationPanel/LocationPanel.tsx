import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import type { MapPin } from '../../../data/territory';
import { mapsUrl } from '../../../data/territory';
import './locationPanel.css';

interface LocationPanelProps {
    pin: MapPin;
    onClose: () => void;
    onAddStory: (slug: string) => void;
}

const LocationPanel = ({ pin, onClose, onAddStory }: LocationPanelProps) => {
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo('.location-panel__backdrop', { opacity: 0 }, { opacity: 1, duration: 0.4 });
            gsap.fromTo('.location-panel__card',
                { opacity: 0, y: 40, clipPath: 'inset(0 0 100% 0)' },
                { opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)', duration: 0.7, ease: 'power4.out' });
        }, panelRef);
        return () => ctx.revert();
    }, [pin.slug]);

    return (
        <div className="location-panel" ref={panelRef}>
            <button type="button" className="location-panel__backdrop" onClick={onClose} aria-label="Close" />

            <div className="location-panel__card" role="dialog" aria-modal="true" aria-label={pin.name}>
                <button type="button" className="location-panel__close" onClick={onClose}>✕ CLOSE</button>

                <div className="location-panel__media">
                    <img src={pin.image} alt={pin.name} className="location-panel__img" />
                </div>

                <div className="location-panel__body">
                    <span className="location-panel__coord">{pin.coord}</span>
                    <h2 className="location-panel__name">{pin.name}</h2>
                    <p className="location-panel__desc">{pin.description}</p>

                    <div className="location-panel__actions">
                        <a className="location-panel__btn location-panel__btn--primary"
                           href={mapsUrl(pin)} target="_blank" rel="noopener noreferrer">
                            OPEN IN MAPS
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: '8px' }} aria-hidden="true">
                                <path d="M7 17l9.2-9.2M17 17V7H7"/>
                            </svg>
                        </a>
                        <button type="button" className="location-panel__btn"
                                onClick={() => onAddStory(pin.slug)}>
                            ADD YOUR STORY
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: '8px' }} aria-hidden="true">
                                <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LocationPanel;