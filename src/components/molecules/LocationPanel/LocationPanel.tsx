import { useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import type { MapPin } from '../../../data/territory';
import { mapsUrl } from '../../../data/territory';
import './locationPanel.css';

interface LocationPanelProps {
    pin: MapPin;
    onClose: () => void;
    onAddStory: (slug: string) => void;
}

const playCloseTone = () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
};

const LocationPanel = ({ pin, onClose, onAddStory }: LocationPanelProps) => {
    const panelRef = useRef<HTMLDivElement>(null);

    const handleClose = useCallback(() => {
        playCloseTone();
        const tl = gsap.timeline({ onComplete: onClose });
        tl.to('.location-panel__card', {
            duration: 0.3,
            ease: 'power3.in',
            opacity: 0,
            scale: 0.95,
        })
            .to('.location-panel__backdrop', { opacity: 0, duration: 0.2 }, 0);
    }, [onClose]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [handleClose]);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo('.location-panel__backdrop', { opacity: 0 }, { opacity: 1, duration: 0.3 });
            gsap.fromTo('.location-panel__card',
                { opacity: 0, scale: 0.98, y: 10 },
                { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'power2.out' });
        }, panelRef);
        return () => ctx.revert();
    }, [pin.slug]);

    return (
        <div className="location-panel" ref={panelRef}>
            <button type="button" className="location-panel__backdrop" onClick={handleClose} aria-label="Close" />
            <div className="location-panel__card" role="dialog" aria-modal="true" aria-label={pin.name}>
                <button type="button" className="location-panel__close" onClick={handleClose}>✕ CLOSE</button>
                <div className="location-panel__media">
                    <img src={pin.image} alt={pin.name} className="location-panel__img" />
                </div>
                <div className="location-panel__body">
                    <span className="location-panel__coord">{pin.coord}</span>
                    <h2 className="location-panel__name">{pin.name}</h2>
                    <p className="location-panel__desc">{pin.description}</p>
                    <div className="location-panel__actions">
                        <a className="location-panel__btn location-panel__btn--primary" href={mapsUrl(pin)} target="_blank" rel="noopener noreferrer">
                            OPEN IN MAPS ↗
                        </a>
                        <button type="button" className="location-panel__btn" onClick={() => onAddStory(pin.slug)}>
                            ADD YOUR STORY →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LocationPanel;