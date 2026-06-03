import { Link } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import useParallax from '../../../hooks/useParallax';
import BlurText from '../../atoms/BlurText/BlurText';
import CameraFeed from '../../molecules/CameraFeed/CameraFeed';
import './heroSection.css';

interface HeroSectionProps {
    streamUrl?:   string;
    fallbackSrc?: string;
}

const HeroSection = ({ streamUrl, fallbackSrc }: HeroSectionProps) => {
    const { t }      = useLanguage();
    const contentRef = useParallax(0.022);

    return (
        <section className="hero" aria-label="Hero">
            {/* Background camera feed */}
            <div className="hero__bg" aria-hidden>
                <CameraFeed src={streamUrl} fallbackSrc={fallbackSrc} />
                <div className="hero__overlay" />
            </div>

            {/* Parallax content */}
            <div className="hero__content" ref={contentRef}>
                <p className="hero__eyebrow">
                    <BlurText delay={0}>{t.hero.eyebrow}</BlurText>
                </p>

                <h1 className="hero__title">
                    {t.hero.title.split('\n').map((line, i) => (
                        <span key={i} className="hero__title-line">
                            <BlurText delay={i * 160 + 80}>{line}</BlurText>
                        </span>
                    ))}
                </h1>

                <p className="hero__concept">
                    <BlurText delay={500} duration={1400}>{t.hero.concept}</BlurText>
                </p>

                <div className="hero__cta">
                    <BlurText delay={800}>
                        <Link to="/explore" className="hero__cta-link">
                            {t.hero.cta}
                            <span className="hero__cta-arrow" aria-hidden>→</span>
                        </Link>
                    </BlurText>
                </div>
            </div>

            {/* Scroll indicator */}
            <div className="hero__scroll" aria-hidden>
                <div className="hero__scroll-line" />
            </div>
        </section>
    );
};

export default HeroSection;
