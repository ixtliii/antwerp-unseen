import { useLanguage } from '../../../context/LanguageContext';
import './heroSection.css';

// Current active screen location — comes from API in production
const CURRENT_LOCATION = 'Lange Leemstraat';

interface HeroSectionProps {
    streamUrl?:   string;
    fallbackSrc?: string;
}

const HeroSection = ({ streamUrl, fallbackSrc }: HeroSectionProps) => {
    const { t } = useLanguage();

    return (
        <section className="hero" aria-label="Live camera feed">
            {/* Camera / fallback image fills the section */}
            <div className="hero__media">
                {streamUrl ? (
                    <video
                        className="hero__video"
                        src={streamUrl}
                        autoPlay muted loop playsInline
                        aria-label="Live feed from Antwerp"
                    />
                ) : fallbackSrc ? (
                    <img
                        className="hero__img"
                        src={fallbackSrc}
                        alt="Antwerp street view"
                    />
                ) : null}
            </div>

            {/* Halftone corner decorations */}
            <div className="hero__dots hero__dots--tl" aria-hidden />
            <div className="hero__dots hero__dots--tr" aria-hidden />
            <div className="hero__dots hero__dots--bl" aria-hidden />
            <div className="hero__dots hero__dots--br" aria-hidden />

            {/* Location label — centered */}
            <div className="hero__location" aria-label={`Currently showing: ${CURRENT_LOCATION}`}>
                {CURRENT_LOCATION}
            </div>

            {/* Eyebrow — top right */}
            <p className="hero__eyebrow">{t.hero.eyebrow}</p>
        </section>
    );
};

export default HeroSection;