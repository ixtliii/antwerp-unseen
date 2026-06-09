import './artistListItem.css';

interface Props {
    name: string;
    isActive: boolean;
    activeArtwork?: { title: string; date: string };
    onClick: () => void;
}

const ArtistListItem = ({ name, isActive, activeArtwork, onClick }: Props) => {
    return (
        <button
            type="button"
            className={`artist-item ${isActive ? 'artist-item--active' : ''}`}
            onClick={onClick}
            aria-pressed={isActive}
        >
            <span className="artist-item__name">{name}</span>
            {isActive && activeArtwork && (
                <span className="artist-item__meta">
                    <span className="artist-item__meta-title">{activeArtwork.title}</span>
                    <span className="artist-item__meta-date">{activeArtwork.date}</span>
                </span>
            )}
        </button>
    );
};

export default ArtistListItem;