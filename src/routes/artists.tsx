import PageLayout from '../layouts/PageLayout';
import ArtistsExplorer from '../components/organisms/ArtistsExplorer/ArtistsExplorer';

const Artists = () => {
    return (
        <PageLayout navLight noPadding>
            <ArtistsExplorer />
        </PageLayout>
    );
};

export default Artists;