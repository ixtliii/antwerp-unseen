import { useEffect, useRef, useState, useCallback } from 'react';
import type { Artwork } from '../../../types';
import DitherVideo from '../../atoms/DitherVideo/DitherVideo';
import ArtistCard from "../../molecules/ArtistCard/ArtistCard.tsx";
import SearchBar from "../../molecules/SearchBar/SearchBar.tsx";
import ArtworkDetail from "../../organisms/ArtworkDetail/ArtworkDetail.tsx";
import ArtistSubmitModal from "../../organisms/ArtistSubmitModal/ArtistSubmitModal.tsx";
import { supabase } from '../../../lib/supabaseClient';
import './artistsArchive.css';
import { AnimatePresence } from 'framer-motion';

type ArtworkWithKey = Artwork & { _key: string };

const splitIntoColumns = <T,>(items: T[], count: number): T[][] => {
    const cols: T[][] = Array.from({ length: count }, () => []);
    items.forEach((item, i) => cols[i % count].push(item));
    return cols;
};

const ArtistsArchive = () => {
    const [search, setSearch] = useState('');
    const [artworks, setArtworks] = useState<Artwork[]>([]);
    const [colCount, setColCount] = useState(3);
    const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
    const [submitOpen, setSubmitOpen] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const colRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);
    const rafRef = useRef(0);
    const scrollY = useRef(0);

    const setColRef = useCallback((el: HTMLDivElement | null, idx: number) => {
        colRefs.current[idx] = el;
    }, []);

    useEffect(() => {
        const checkMobile = () => setColCount(window.matchMedia('(max-width: 48em)').matches ? 2 : 3);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
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

            if (error) return;

            if (data) {
                const uniqueMap = new Map();

                data.forEach((item: any) => {
                    if (!uniqueMap.has(item.id)) {
                        let artistName = 'Unknown Artist';

                        if (item.artist) {
                            if (Array.isArray(item.artist) && item.artist.length > 0) {
                                artistName = item.artist[0].name;
                            } else if (typeof item.artist === 'object' && item.artist.name) {
                                artistName = item.artist.name;
                            }
                        }

                        uniqueMap.set(item.id, {
                            ...item,
                            artist: {
                                name: artistName
                            }
                        });
                    }
                });

                setArtworks(Array.from(uniqueMap.values()) as Artwork[]);
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

        const tick = () => {
            const y = scrollY.current;

            for (let i = 0; i < 3; i++) {
                const col = colRefs.current[i];
                if (!col) continue;

                const translateY = COL_SPEEDS[i] * y;
                col.style.transform = `translateY(${translateY}px)`;
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

    const getSuggestions = () => {
        const suggestionsSet = new Set<string>();

        if (!search.trim()) {
            for (const a of artworks) {
                if (a.artist?.name && a.artist.name !== 'Unknown Artist') {
                    suggestionsSet.add(a.artist.name);
                }
                if (suggestionsSet.size >= 5) break;
            }
            if (suggestionsSet.size < 5) {
                for (const a of artworks) {
                    if (a.name) suggestionsSet.add(a.name);
                    if (suggestionsSet.size >= 5) break;
                }
            }
            return Array.from(suggestionsSet);
        }

        const searchLower = search.toLowerCase();

        artworks.forEach((a) => {
            if (a.name?.toLowerCase().includes(searchLower)) suggestionsSet.add(a.name);
            if (a.artist?.name?.toLowerCase().includes(searchLower)) suggestionsSet.add(a.artist.name);
        });

        suggestionsSet.delete(search);
        return Array.from(suggestionsSet).slice(0, 5);
    };

    const suggestions = getSuggestions();

    const isSearching = search.trim().length > 0;
    const itemsToShow = isSearching
        ? filtered
        : Array.from({ length: 12 }).flatMap(() => filtered);

    const artworksWithKey: ArtworkWithKey[] = itemsToShow.map((a, j) => ({
        ...a,
        _key: `${a.id || 'unknown'}-${j}`
    }));

    const columns = splitIntoColumns<ArtworkWithKey>(artworksWithKey, colCount);

    return (
        <div className="artists-layout">
            <DitherVideo
                src="/videos/archive1.mp4"
                pixelSize={7}
                intensity={0.35}
                cutout
                playbackRate={0.4}
                mouseReactive
                className="artists-bg-video"
            />

            <aside className="artists-sidebar">
                <div className="artists-sidebar__inner">
                    <div className="artists-sidebar__top">
                        <SearchBar
                            search={search}
                            setSearch={setSearch}
                            suggestions={suggestions}
                            placeholder="Search"
                        />
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
                        <button
                            type="button"
                            className="artists-sidebar__submit"
                            onClick={() => setSubmitOpen(true)}
                        >
                            Submit your work →
                        </button>
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
                                <ArtistCard
                                    key={artwork._key}
                                    artwork={artwork}
                                    onClick={() => setSelectedArtwork(artwork)}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Mobile: submit button lives in the bottom bar alongside search */}
            <div className="artists-mobile-search">
                <SearchBar
                    search={search}
                    setSearch={setSearch}
                    suggestions={suggestions}
                    placeholder="Search artist or work..."
                    transparentBackground={true}
                />
                <button
                    type="button"
                    className="artists-mobile-submit"
                    onClick={() => setSubmitOpen(true)}
                    aria-label="Submit your work"
                >
                    +
                </button>
            </div>

            <AnimatePresence>
                {selectedArtwork && (
                    <ArtworkDetail
                        artwork={selectedArtwork}
                        onClose={() => setSelectedArtwork(null)}
                    />
                )}
                {submitOpen && (
                    <ArtistSubmitModal onClose={() => setSubmitOpen(false)} />
                )}
            </AnimatePresence>
        </div>
    );
};

export default ArtistsArchive;