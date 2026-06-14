import './locationMarker.css';

interface LocationMarkerProps {
    color?: 'green' | 'orange';
    active?: boolean;
    size?: number;
}

const LocationMarker = ({ color = 'green', active = false, size = 14 }: LocationMarkerProps) => {
    return (
        <span
            className={`location-marker location-marker--${color} ${active ? 'is-active' : ''}`}
            style={{ width: size, height: size }}
            aria-hidden
        />
    );
};

export default LocationMarker;