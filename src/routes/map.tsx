import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../layouts/PageLayout';
import TerritoryMap from '../components/organisms/TerritoryMap/TerritoryMap';
import LocationPanel from '../components/molecules/LocationPanel/LocationPanel';
import { triggerPageTransition } from '../components/globals/PixelTransition/triggerTransition';
import type { MapPin } from '../data/territory';
import './map.css';

const MapPage = () => {
    const navigate = useNavigate();
    const [activePin, setActivePin] = useState<MapPin | null>(null);

    const handleAddStory = (slug: string) => {
        triggerPageTransition(() => navigate(`/submit?location=${slug}`));
    };

    return (
        <PageLayout noPadding showFooter={false}>
            <div className="map-page">
                <h1 className="map-page__head">Five spots. One city. The screens are waiting.</h1>
                <span className="map-page__corner map-page__corner--bl">51.21°N 4.40°E</span>

                <TerritoryMap activeSlug={activePin?.slug ?? null} onSelectPin={setActivePin} />

                <p className={`map-page__hint ${activePin ? 'is-focused' : ''}`}>
                    {activePin ? 'Tap out or press Esc to return' : 'Tap a marker to explore'}
                </p>

                {activePin && (
                    <LocationPanel
                        pin={activePin}
                        onClose={() => setActivePin(null)}
                        onAddStory={handleAddStory}
                    />
                )}
            </div>
        </PageLayout>
    );
};

export default MapPage;