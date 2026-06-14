import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { triggerPageTransition } from '../../globals/PixelTransition/triggerTransition';
import ViewToggle from '../../atoms/ViewToggle/ViewToggle';
import LocationsMap from '../LocationsMap/LocationsMap';
import LocationsList from '../LocationsList/LocationsList';
import './locationsExplorer.css';

type View = 'map' | 'list';

const LocationsExplorer = () => {
    const navigate = useNavigate();
    const [view, setView] = useState<View>('map');

    const handleSelect = (slug: string) => {
        triggerPageTransition(() => navigate(`/map/${slug}`));
    };

    return (
        <div className="locations-explorer">
            <div className={`locations-explorer__view ${view === 'map' ? 'is-visible' : ''}`}>
                {view === 'map' && <LocationsMap onSelect={handleSelect} />}
            </div>
            <div className={`locations-explorer__view ${view === 'list' ? 'is-visible' : ''}`}>
                {view === 'list' && <LocationsList />}
            </div>

            <ViewToggle view={view} onChange={setView} />
        </div>
    );
};

export default LocationsExplorer;