import type { Artwork } from '../../../types';
import './artistCard.css'; // New CSS file import

type Props = {
    artwork: Artwork;
};

const ArtistCard = ({ artwork }: Props) => {
    return (
        <div className="artists-card">
            <div className="artists-card__frame">
                <div className="artists-card__header">
                    <div className="artists-card__title-row">
                        <span className="artists-card__dot" aria-hidden />
                        <span className="artists-card__title">{artwork.name}</span>
                    </div>
                    <p className="artists-card__artist">
                        {artwork.artist.name}
                    </p>
                </div>
                <div className="artists-card__img-wrap">
                    <img
                        src={artwork.image_url}
                        alt={artwork.name}
                        loading="lazy"
                    />
                </div>
            </div>
        </div>
    );
};

export default ArtistCard;