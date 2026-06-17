import { useState } from 'react';
import { PINS, mapsUrl } from '../../../data/territory';
import './locationListView.css';

interface LocationListViewProps {
    onAddStory: (slug: string) => void;
}

const LocationListView = ({ onAddStory }: LocationListViewProps) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const active = PINS[activeIndex];

    return (
        <div className="location-list">
            <ul className="location-list__names">
                {PINS.map((pin, i) => (
                    <li key={pin.slug}>
                        <button
                            type="button"
                            className={`location-list__name ${i === activeIndex ? 'is-active' : ''}`}
                            onMouseEnter={() => setActiveIndex(i)}
                            onFocus={() => setActiveIndex(i)}
                            onClick={() => setActiveIndex(i)}
                        >
                            {pin.name}
                        </button>
                    </li>
                ))}
            </ul>

            <figure className="location-list__preview">
                <img className="location-list__img" src={active.image} alt={active.name} />
                <figcaption className="location-list__coord">{active.coord}</figcaption>
            </figure>

            <div className="location-list__actions">
                <a className="location-list__btn location-list__btn--primary"
                   href={mapsUrl(active)} target="_blank" rel="noopener noreferrer">
                    Open in Maps ↗
                </a>
                <button type="button" className="location-list__btn" onClick={() => onAddStory(active.slug)}>
                    Add your story →
                </button>
            </div>
        </div>
    );
};

export default LocationListView;