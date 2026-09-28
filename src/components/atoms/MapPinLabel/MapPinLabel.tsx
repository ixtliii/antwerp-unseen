import { forwardRef } from 'react';
import './mapPinLabel.css';

interface MapPinLabelProps {
    name: string;
    coord: string;
    onSelect: () => void;
    onHover: (hovering: boolean) => void;
}

const MapPinLabel = forwardRef<HTMLButtonElement, MapPinLabelProps>(
    ({ name, coord, onSelect, onHover }, ref) => (
        <button
            ref={ref}
            type="button"
            className="map-pin-label"
            onClick={onSelect}
            onMouseEnter={() => onHover(true)}
            onMouseLeave={() => onHover(false)}
        >
            <span className="map-pin-label__dot" aria-hidden />
            <span className="map-pin-label__text">
                <span className="map-pin-label__name">{name}</span>
                <span className="map-pin-label__coord">{coord}</span>
            </span>
        </button>
    )
);

MapPinLabel.displayName = 'MapPinLabel';
export default MapPinLabel;