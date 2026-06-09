import { useEffect, useRef, useState } from 'react';
import ArtistListItem from '../../molecules/ArtistListItem/ArtistListItem';
import { MOCK_ARTISTS } from '../../../data/mockArtists';
import useFilterSound from '../../../hooks/useFilterSound';
import './artistsExplorer.css';

const formatDate = (iso: string) => {
    const d = new Date(iso);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${mm}/${dd}/${d.getFullYear()}`;
};

const ARTWORKS_FLAT = MOCK_ARTISTS.flatMap((artist) =>
    artist.artworks.map((work) => ({
        ...work,
        artistId: artist.id,
        artistName: artist.name,
    }))
);

const PixelReveal = ({ isRevealed }: { isRevealed: boolean }) => {
    const [delays] = useState(() => {
        const totalPixels = 192;
        const arr = Array.from({ length: totalPixels }).map((_, i) => i);
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr.map((val) => (val * 0.0035).toFixed(3));
    });

    return (
        <div className="artists-explorer__pixel-overlay" aria-hidden="true">
            {delays.map((delay, i) => (
                <div
                    key={i}
                    className={`artists-explorer__pixel ${isRevealed ? 'artists-explorer__pixel--revealed' : ''}`}
                    style={{ transitionDelay: `${isRevealed ? delay : 0}s` }}
                />
            ))}
        </div>
    );
};

const ArtistsExplorer = () => {
    const [activeArtworkId, setActiveArtworkId] = useState(ARTWORKS_FLAT[0]?.id);
    const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

    const activeArtworkIdRef = useRef(ARTWORKS_FLAT[0]?.id);
    const artworkRefs = useRef<Map<string, HTMLElement>>(new Map());
    const imageRefs = useRef<Map<string, HTMLImageElement>>(new Map());

    const playTick = useFilterSound();

    useEffect(() => {
        const centerObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const artworkId = (entry.target as HTMLElement).dataset.artworkId;
                        if (artworkId && artworkId !== activeArtworkIdRef.current) {
                            activeArtworkIdRef.current = artworkId;
                            setActiveArtworkId(artworkId);
                            playTick();
                        }
                    }
                });
            },
            { rootMargin: '-50% 0px -50% 0px' }
        );

        const revealObserver = new IntersectionObserver(
            (entries) => {
                setRevealedIds((prev) => {
                    const next = new Set(prev);
                    let changed = false;
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            const artworkId = (entry.target as HTMLElement).dataset.artworkId;
                            if (artworkId && !next.has(artworkId)) {
                                next.add(artworkId);
                                changed = true;
                            }
                        }
                    });
                    return changed ? next : prev;
                });
            },
            { rootMargin: '0px 0px -15% 0px' }
        );

        artworkRefs.current.forEach((el) => {
            centerObserver.observe(el);
            revealObserver.observe(el);
        });

        return () => {
            centerObserver.disconnect();
            revealObserver.disconnect();
        };
    }, [playTick]);

    useEffect(() => {
        let rafId: number;
        let previousScrollY = window.scrollY;
        let currentVelocity = 0;

        const handleScroll = () => {
            const windowHeight = window.innerHeight;
            const windowCenter = windowHeight / 2;
            const currentScrollY = window.scrollY;

            const targetVelocity = currentScrollY - previousScrollY;
            currentVelocity += (targetVelocity - currentVelocity) * 0.08;
            previousScrollY = currentScrollY;

            const maxSkew = 4;
            let skewY = currentVelocity * 0.03;
            skewY = Math.max(-maxSkew, Math.min(maxSkew, skewY));

            imageRefs.current.forEach((img, id) => {
                const parent = artworkRefs.current.get(id);
                if (!parent) return;

                const rect = parent.getBoundingClientRect();
                const elementCenter = rect.top + rect.height / 2;
                const distanceToCenter = elementCenter - windowCenter;
                const normalizedDistance = distanceToCenter / windowHeight;

                const parallaxAmount = distanceToCenter * 0.25;
                const scale = 1.3 - Math.abs(normalizedDistance) * 0.25;
                const rotateX = normalizedDistance * -12;

                img.style.transform = `translate3d(0, ${parallaxAmount}px, 0) scale(${scale}) rotateX(${rotateX}deg) skewY(${skewY}deg)`;
            });

            rafId = requestAnimationFrame(handleScroll);
        };

        rafId = requestAnimationFrame(handleScroll);

        return () => cancelAnimationFrame(rafId);
    }, []);

    const setArtworkRef = (id: string) => (el: HTMLElement | null) => {
        if (el) artworkRefs.current.set(id, el);
        else artworkRefs.current.delete(id);
    };

    const setImageRef = (id: string) => (el: HTMLImageElement | null) => {
        if (el) imageRefs.current.set(id, el);
        else imageRefs.current.delete(id);
    };

    const scrollToArtist = (artistId: string) => {
        const firstWork = ARTWORKS_FLAT.find((w) => w.artistId === artistId);
        if (firstWork) {
            const el = artworkRefs.current.get(firstWork.id);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const activeArtwork = ARTWORKS_FLAT.find((w) => w.id === activeArtworkId) || ARTWORKS_FLAT[0];
    const activeArtistId = activeArtwork?.artistId;

    return (
        <section className="artists-explorer" aria-label="Local artists">
            <h1 className="artists-explorer__title">DISCOVER LOCAL ARTISTS</h1>

            <div className="artists-explorer__body">
                <ul className="artists-explorer__list">
                    {MOCK_ARTISTS.map((artist) => {
                        const isActive = artist.id === activeArtistId;
                        return (
                            <li key={artist.id} className="artists-explorer__list-item">
                                <ArtistListItem
                                    name={artist.name}
                                    isActive={isActive}
                                    activeArtwork={
                                        isActive && activeArtwork
                                            ? {
                                                title: activeArtwork.title,
                                                date: formatDate(activeArtwork.date),
                                            }
                                            : undefined
                                    }
                                    onClick={() => scrollToArtist(artist.id)}
                                />
                            </li>
                        );
                    })}
                </ul>

                <div className="artists-explorer__artworks">
                    {ARTWORKS_FLAT.map((work) => {
                        const isRevealed = revealedIds.has(work.id);
                        return (
                            <figure
                                key={work.id}
                                ref={setArtworkRef(work.id)}
                                data-artwork-id={work.id}
                                className={`artists-explorer__artwork ${isRevealed ? 'artists-explorer__artwork--revealed' : ''}`}
                            >
                                <div className="artists-explorer__image-wrapper">
                                    <PixelReveal isRevealed={isRevealed} />
                                    <img
                                        ref={setImageRef(work.id)}
                                        src={work.imageUrl}
                                        alt={`${work.title} by ${work.artistName}`}
                                        loading="lazy"
                                    />
                                </div>
                                <figcaption className="artists-explorer__artwork-caption">
                                    <div className="artists-explorer__caption-inner">
                                        <span>{work.title}</span>
                                    </div>
                                    <div className="artists-explorer__caption-inner">
                                        <span style={{ transitionDelay: '0.1s' }}>{formatDate(work.date)}</span>
                                    </div>
                                </figcaption>
                            </figure>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default ArtistsExplorer;