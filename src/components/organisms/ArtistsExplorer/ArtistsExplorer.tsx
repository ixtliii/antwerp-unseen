import { useState } from 'react';
import ArtistListItem from '../../molecules/ArtistListItem/ArtistListItem';
import { MOCK_ARTISTS } from '../../../data/mockArtists';
import './artistsExplorer.css';

const formatDate = (iso: string) => {
    const d = new Date(iso);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${mm}/${dd}/${d.getFullYear()}`;
};

const ArtistsExplorer = () => {
    const [activeId, setActiveId] = useState(MOCK_ARTISTS[0].id);
    const activeArtist = MOCK_ARTISTS.find((a) => a.id === activeId) ?? MOCK_ARTISTS[0];

    return (
        <section className="artists-explorer" aria-label="Local artists">
            <h1 className="artists-explorer__title">DISCOVER LOCAL ARTISTS</h1>

            <div className="artists-explorer__body">
                <div className="artists-explorer__list-wrap">
                    <div className="artists-explorer__rail" aria-hidden />
                    <ul className="artists-explorer__list">
                        {MOCK_ARTISTS.map((artist) => {
                            const isActive = artist.id === activeId;
                            const firstWork = artist.artworks[0];
                            return (
                                <li key={artist.id}>
                                    <ArtistListItem
                                        name={artist.name}
                                        isActive={isActive}
                                        activeArtwork={
                                            isActive && firstWork
                                                ? {
                                                    title: firstWork.title,
                                                    date: formatDate(firstWork.date),
                                                }
                                                : undefined
                                        }
                                        onClick={() => setActiveId(artist.id)}
                                    />
                                </li>
                            );
                        })}
                    </ul>
                </div>

                <div
                    className="artists-explorer__artworks"
                    role="region"
                    aria-label={`Artworks by ${activeArtist.name}`}
                >
                    {activeArtist.artworks.map((work) => (
                        <figure key={work.id} className="artists-explorer__artwork">
                            <img
                                src={work.imageUrl}
                                alt={`${work.title} by ${activeArtist.name}`}
                                loading="lazy"
                            />
                            <figcaption className="artists-explorer__artwork-caption">
                                <span>{work.title}</span>
                                <span>{formatDate(work.date)}</span>
                            </figcaption>
                        </figure>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ArtistsExplorer;