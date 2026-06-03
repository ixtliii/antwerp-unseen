import PageLayout from '../layouts/PageLayout';
import HeroSection from '../components/organisms/HeroSection/HeroSection';
import ConceptStatement from '../components/organisms/ConceptStatement/ConceptStatement';
import LocalArtistsSection from '../components/organisms/LocalArtistsSection/LocalArtistsSection';
import PromptSection from '../components/organisms/PromptSection/PromptSection';

const Home = () => (
    // navLight + noPadding: hero is full-bleed directly below the light navbar
    <PageLayout navLight noPadding>
        <HeroSection
            streamUrl={undefined}
            fallbackSrc="https://picsum.photos/seed/antwerp/1600/900"
        />
        <ConceptStatement />
        <LocalArtistsSection />
        <PromptSection />
    </PageLayout>
);

export default Home;