import { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import type { Artwork } from '../../../types';
import { HARDCODED_ARTWORKS } from '../../../data/mockArtworks';
import { ArtworkGallery } from '../ArtworkGallery/ArtworkGallery.tsx';
import DitherVideo from '../../atoms/DitherVideo/DitherVideo';
import './artistsArchive.css';

const ArtistsArchive = () => {
    const [activeArtwork, setActiveArtwork] = useState<Artwork | null>(null);

    return (
        <main className="archive-page">
            <DitherVideo
                src="/videos/archive.mp4"
                pixelSize={6}
                intensity={0.15}
                cutout
                playbackRate={0.5}
                mouseReactive
                className="archive-bg-video"
            />

            <div className="archive-canvas-wrapper">
                <Canvas
                    camera={{ position: [0, 0, 35], fov: 45 }}
                    dpr={[1, 2]}
                >
                    <fog attach="fog" args={['#040404', 15, 60]} />
                    <ambientLight intensity={0.8} />
                    <Suspense fallback={null}>
                        <ArtworkGallery
                            artworks={HARDCODED_ARTWORKS}
                            onHover={setActiveArtwork}
                        />
                    </Suspense>
                </Canvas>
            </div>

            <div className="archive-ui-layer">
                <div className={`archive-info ${activeArtwork ? 'is-visible' : ''}`}>
                    <p className="archive-info__artist">
                        {activeArtwork?.artist.name} <span className="archive-info__sep">/</span> {activeArtwork?.year}
                    </p>
                    <h1 className="archive-info__title">
                        {activeArtwork?.name || '---'}
                    </h1>
                    <p className="archive-info__desc">
                        {activeArtwork?.description}
                    </p>
                </div>

                <div className="archive-instruction">
                    [ DRAG TO EXPLORE ]
                </div>
            </div>
        </main>
    );
};

export default ArtistsArchive;