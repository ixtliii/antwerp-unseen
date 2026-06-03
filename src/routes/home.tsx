import Footer from '../components/molecules/Footer/Footer';
import HeroSection from '../components/organisms/HeroSection/HeroSection';
import MapSection from '../components/organisms/MapSection/MapSection';
import ArtworksCarousel from '../components/organisms/ArtworksCarousel/ArtworksCarousel';
import ShareSection from '../components/organisms/ShareSection/ShareSection';
import PageLayout from '../layouts/PageLayout.tsx';
import './home.css';

const Home = () => (
    <PageLayout>
        <main>
            <HeroSection
                streamUrl={undefined}
                fallbackSrc="https://picsum.photos/seed/antwerp/1600/900"
            />
            <MapSection />
            <ArtworksCarousel />
            <ShareSection />
        </main>
        <Footer />
    </PageLayout>
);

export default Home;
