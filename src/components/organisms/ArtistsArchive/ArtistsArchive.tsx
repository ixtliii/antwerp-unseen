import { useEffect, useRef, useState, useCallback } from 'react';
import type { Artwork } from '../../../types';
import DitherVideo from '../../atoms/DitherVideo/DitherVideo';
import ArtistCard from "../../molecules/ArtistCard/ArtistCard.tsx";
import { supabase } from '../../../lib/supabaseClient';
import './artistsArchive.css';

type ArtworkWithKey = Artwork & { _key: string };

const splitIntoColumns = <T,>(items: T[], count: number): T[][] => {
    const cols: T[][] = Array.from({ length: count }, () => []);
    items.forEach((item, i) => cols[i % count].push(item));
    return cols;
};

const ArtistsArchive = () => {
    const [search, setSearch] = useState('');
    const [artworks, setArtworks] = useState<Artwork[]>([]);

    const scrollRef = useRef<HTMLDivElement>(null);
    const colRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);
    const rafRef = useRef(0);
    const scrollY = useRef(0);
    const lastScrollY = useRef(0);
    const smoothVelocity = useRef(0);

    const setColRef = useCallback((el: HTMLDivElement | null, idx: number) => {
        colRefs.current[idx] = el;
    }, []);

    useEffect(() => {
        const fetchArtworks = async () => {
            const { data, error } = await supabase
                .from('artworks')
                .select(`
                    *,
                    artist:artists (
                        name
                    )
                `);

            if (error) {
                return;
            }

            if (data) {
                const formattedArtworks = data.map((item: any) => {
                    let artistName = 'Unknown Artist';

                    if (item.artist) {
                        if (Array.isArray(item.artist) && item.artist.length > 0) {
                            artistName = item.artist[0].name;
                        } else if (typeof item.artist === 'object' && item.artist.name) {
                            artistName = item.artist.name;
                        }
                    }

                    return {
                        ...item,
                        artist: {
                            name: artistName
                        }
                    };
                });

                setArtworks(formattedArtworks as Artwork[]);
            }
        };

        fetchArtworks();
    }, []);

    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;
        const onScroll = () => { scrollY.current = container.scrollTop; };
        container.addEventListener('scroll', onScroll, { passive: true });
        return () => container.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const COL_SPEEDS = [0.28, -0.45, 0.36];
        const COL_ROTATIONS = [0.006, 0, 0.005];
        const COL_SKEWS = [0.03, 0, 0.025];

        const tick = () => {
            const y = scrollY.current;
            const rawVelocity = y - lastScrollY.current;
            lastScrollY.current = y;
            smoothVelocity.current += (rawVelocity - smoothVelocity.current) * 0.1;

            for (let i = 0; i < 3; i++) {
                const col = colRefs.current[i];
                if (!col) continue;
                const translateY = COL_SPEEDS[i] * y;
                const rotate = COL_ROTATIONS[i] * smoothVelocity.current;
                const skew = COL_SKEWS[i] * smoothVelocity.current;
                col.style.transform =
                    `translateY(${translateY}px) rotate(${rotate}deg) skewY(${skew}deg)`;
            }

            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(rafRef.current);
    }, []);

    const filtered = artworks.filter((a) => {
        const artworkName = a.name?.toLowerCase() || '';
        const artistName = a.artist?.name?.toLowerCase() || '';
        const searchString = search.toLowerCase();

        return artworkName.includes(searchString) || artistName.includes(searchString);
    });

    const artworksWithKey: ArtworkWithKey[] = filtered.map((a, j) => ({ ...a, _key: `${a.id || j}` }));

    const columns = splitIntoColumns<ArtworkWithKey>(artworksWithKey, 3);

    return (
        <div className="artists-layout">
            <DitherVideo
                src="/videos/archive1.mp4"
                pixelSize={7}
                intensity={0.25}
                cutout
                playbackRate={0.4}
                mouseReactive
                className="artists-bg-video"
            />

            <aside className="artists-sidebar">
                <div className="artists-sidebar__inner">
                    <div className="artists-sidebar__top">
                        <div className="artists-sidebar__search">
                            <span className="artists-sidebar__search-icon">⌕</span>
                            <input
                                type="text"
                                placeholder="Search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="artists-sidebar__search-input"
                            />
                        </div>
                    </div>

                    <div className="artists-sidebar__bottom">
                        <h1 className="artists-sidebar__title">
                            DISCOVER LOCAL<br />ARTISTS
                        </h1>
                        <p className="artists-sidebar__desc">
                            Support a local artist in Antwerp and<br />
                            explore their artistic scene today by<br />
                            checking out their amazing artworks!
                        </p>
                    </div>
                </div>
            </aside>

            <div className="artists-grid-scroll" ref={scrollRef}>
                <div className="artists-grid">
                    {columns.map((col, colIdx) => (
                        <div
                            key={colIdx}
                            className={`artists-col artists-col--${colIdx}`}
                            ref={(el) => setColRef(el, colIdx)}
                        >
                            {col.map((artwork) => (
                                <ArtistCard key={artwork._key} artwork={artwork} />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            <div className="artists-mobile-search">
                <span className="artists-sidebar__search-icon">⌕</span>
                <input
                    type="text"
                    placeholder="Search artist or work..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="artists-sidebar__search-input"
                    aria-label="Search artworks"
                />
            </div>
        </div>
    );
};

export default ArtistsArchive;