import { Link } from 'react-router-dom';
import './localArtistsSection.css';

// Mock artist images — replace with real data from API
const MOCK_IMAGES = [
    { id: '1', src: 'https://picsum.photos/seed/art1/300/240', alt: 'Contribution from Borgerhout' },
    { id: '2', src: 'https://picsum.photos/seed/art2/260/200', alt: 'Contribution from the Docks' },
    { id: '3', src: 'https://picsum.photos/seed/art3/280/220', alt: 'Contribution from Berchem' },
    { id: '4', src: 'https://picsum.photos/seed/art4/240/190', alt: 'Contribution from Eilandje' },
    { id: '5', src: 'https://picsum.photos/seed/art5/270/210', alt: 'Contribution from Merksem' },
    { id: '6', src: 'https://picsum.photos/seed/art6/250/200', alt: 'Contribution from Hoboken' },
];

const LocalArtistsSection = () => {
    return (
        <section className="artists" aria-label="Local artists">
            {/* Scattered image grid */}
            <div className="artists__grid" aria-hidden>
                {MOCK_IMAGES.map((img, i) => (
                    <div key={img.id} className={`artists__img-wrap artists__img-wrap--${i + 1}`}>
                        <img src={img.src} alt={img.alt} loading="lazy" />
                    </div>
                ))}
            </div>

            {/* Content overlay */}
            <div className="artists__content">
                <h2 className="artists__title">DISCOVER LOCAL ARTIST</h2>

                <Link to="/explore" className="artists__cta">
                    SUPPORT LOCAL ARTISTS
                </Link>

                <div className="artists__secondary">
                    <p className="artists__secondary-label">Are you a local artist too?</p>
                    <Link to="/submit" className="artists__submit-link">
                        Submit your work →
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default LocalArtistsSection;