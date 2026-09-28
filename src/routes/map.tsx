import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../layouts/PageLayout';
import TerritoryMap from '../components/organisms/TerritoryMap/TerritoryMap';
import LocationListView from '../components/organisms/LocationListView/LocationListView';
import LocationPanel from '../components/molecules/LocationPanel/LocationPanel';
import ViewToggle from '../components/atoms/ViewToggle/ViewToggle';
import { triggerPageTransition } from '../components/globals/PixelTransition/triggerTransition';
import type { MapPin } from '../data/territory';
import './map.css';

type View = 'map' | 'list';

const MapPage = () => {
    const navigate = useNavigate();
    const [view, setView] = useState<View>('map');
    const [activePin, setActivePin] = useState<MapPin | null>(null);

    const handleAddStory = (slug: string) => {
        triggerPageTransition(() => navigate(`/submit?location=${slug}`));
    };

    return (
        <PageLayout noPadding showFooter={false}>
            <div className="map-page">
                <h1 className="map-page__head">Five spots. One city. The screens are waiting.</h1>

                {view === 'map' ? (
                    <>
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
                    </>
                ) : (
                    <LocationListView onAddStory={handleAddStory} />
                )}

                <ViewToggle view={view} onChange={setView} />
            </div>
        </PageLayout>
    );
};

export default MapPage;