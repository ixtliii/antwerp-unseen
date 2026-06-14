import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { LOCATIONS } from '../../../data/locations';
import LocationListItem from '../../molecules/LocationListItem/LocationListItem';
import LocationMarker from '../../atoms/LocationMarker/LocationMarker';
import './locationsList.css';

const LocationsList = () => {
    const rootRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(2); // matches screenshot default

    const active = LOCATIONS[activeIndex];

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo('.location-list-item',
                { opacity: 0, x: -30 },
                { opacity: 1, x: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out' }
            );
            gsap.fromTo('.locations-list__preview',
                { opacity: 0, scale: 0.96 },
                { opacity: 1, scale: 1, duration: 0.8, ease: 'expo.out' }
            );
        }, rootRef);
        return () => ctx.revert();
    }, []);

    // animate preview swap when active changes
    useEffect(() => {
        if (!imgRef.current) return;
        gsap.fromTo(imgRef.current,
            { opacity: 0, clipPath: 'inset(0 0 100% 0)' },
            { opacity: 1, clipPath: 'inset(0 0 0% 0)', duration: 0.7, ease: 'power4.out' }
        );
    }, [activeIndex]);

    return (
        <div className="locations-list" ref={rootRef}>
            <div className="locations-list__names">
                {LOCATIONS.map((loc, i) => (
                    <LocationListItem
                        key={loc.slug}
                        name={loc.name}
                        active={i === activeIndex}
                        onHover={() => setActiveIndex(i)}
                        onClick={() => setActiveIndex(i)}
                    />
                ))}
            </div>

            <div className="locations-list__preview">
                <div className="locations-list__marker locations-list__marker--top">
                    <LocationMarker color="green" />
                </div>
                <div className="locations-list__marker locations-list__marker--mid">
                    <LocationMarker color="orange" />
                </div>

                <div className="locations-list__img-frame" ref={imgRef}>
                    <span className="locations-list__coords">{active.coordinates}</span>
                    <img src={active.image} alt={active.name} className="locations-list__img" />
                </div>

                <div className="locations-list__marker locations-list__marker--bottom">
                    <LocationMarker color="green" />
                </div>
            </div>
        </div>
    );
};

export default LocationsList;