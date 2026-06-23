import { type CSSProperties } from 'react';
import type { FloatingItem } from '../../organisms/Installation/installationConfig';

// --- Static waveform ---
const Waveform = () => (
    <svg width="36" height="16" viewBox="0 0 36 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        {([1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34] as number[]).map((x, idx) => {
            const heights = [3, 6, 10, 7, 13, 9, 12, 6, 8, 4, 7, 5];
            const h = heights[idx];
            return <rect key={x} x={x} y={(16 - h) / 2} width="1.5" height={h} fill="rgba(255,255,255,0.3)" rx="0.5" />;
        })}
    </svg>
);

// --- Live animated waveform ---
const LiveWaveform = () => (
    <div className="contribution__waveform-live">
        {Array.from({ length: 12 }).map((_, index) => (
            <span
                key={index}
                className="contribution__wave-bar"
                style={{ animationDelay: `${index * 0.065}s` } as CSSProperties}
            />
        ))}
    </div>
);

// --- Photo placeholder ---
const PhotoPlaceholder = () => (
    <svg width="100%" height="80" viewBox="0 0 160 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="160" height="80" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <line x1="0" y1="0" x2="160" y2="80" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        <line x1="160" y1="0" x2="0" y2="80" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
    </svg>
);

interface ContributionCardProps {
    item: FloatingItem;
}

const ContributionCard = ({ item }: ContributionCardProps) => {
    const { contribution, highlighted } = item;

    if (highlighted) {
        return (
            <div className="contribution__featured">
                <div className="contribution__featured-top">
                    <LiveWaveform />
                    <span className="contribution__now-playing">● NOW PLAYING</span>
                </div>
                <p className="contribution__featured-text">{contribution.text}</p>
                {contribution.author && (
                    <p className="contribution__featured-author">— {contribution.author}</p>
                )}
                <p className="contribution__featured-meta">{contribution.time} · {contribution.date}</p>
            </div>
        );
    }

    if (contribution.type === 'voice') {
        return (
            <div className="contribution__card">
                <Waveform />
                <p className="contribution__text">{contribution.text}</p>
                {contribution.author && <p className="contribution__author">— {contribution.author}</p>}
                <p className="contribution__meta">{contribution.time} · {contribution.date}</p>
            </div>
        );
    }

    if (contribution.type === 'text') {
        return (
            <div className="contribution__card">
                <p className="contribution__text">{contribution.text}</p>
                {contribution.author && <p className="contribution__author">— {contribution.author}</p>}
                <p className="contribution__meta">{contribution.time} · {contribution.date}</p>
            </div>
        );
    }

    if (contribution.type === 'video') {
        return (
            <div className="contribution__card contribution__card--photo">
                {contribution.videoUrl
                    ? (
                        <video
                            className="contribution__video"
                            src={contribution.videoUrl}
                            autoPlay
                            muted
                            loop
                            playsInline
                        />
                    )
                    : <PhotoPlaceholder />
                }
                {contribution.author && <p className="contribution__author">— {contribution.author}</p>}
                <p className="contribution__meta">{contribution.time} · {contribution.date}</p>
            </div>
        );
    }

    return (
        <div className="contribution__card contribution__card--photo">
            {contribution.imgUrl
                ? <img src={contribution.imgUrl} alt="" />
                : <PhotoPlaceholder />
            }
            <p className="contribution__meta">{contribution.time} · {contribution.date}</p>
        </div>
    );
};

export default ContributionCard;