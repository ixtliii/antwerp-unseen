import PageLayout from '../layouts/PageLayout';
import ArtistArchive from "../components/organisms/ArtistsArchive/ArtistsArchive.tsx";

const Artists = () => {
    return (
        <PageLayout noPadding showFooter={false}>
            <ArtistArchive />
        </PageLayout>
    );
};

export default Artists;