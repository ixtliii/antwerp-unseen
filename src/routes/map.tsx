import PageLayout from '../layouts/PageLayout';
import LocationsExplorer from '../components/organisms/LocationsExplorer/LocationsExplorer';

const MapPage = () => {
    return (
        <PageLayout noPadding showFooter={false}>
            <LocationsExplorer />
        </PageLayout>
    );
};

export default MapPage;