import './locationListItem.css';

interface LocationListItemProps {
    name: string;
    active: boolean;
    onHover: () => void;
    onClick: () => void;
}

const LocationListItem = ({ name, active, onHover, onClick }: LocationListItemProps) => {
    return (
        <button
            type="button"
            className={`location-list-item ${active ? 'is-active' : ''}`}
            onMouseEnter={onHover}
            onClick={onClick}
        >
            {name}
        </button>
    );
};

export default LocationListItem;