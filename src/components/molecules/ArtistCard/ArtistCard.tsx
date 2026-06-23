import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Artwork } from '../../../types';
import { transformedImageUrl } from '../../../lib/supabaseImage';
import './artistCard.css';

type Props = {
    artwork: Artwork & { _key?: string };
    onClick: () => void;
};

const transitionSpring = {
    type: "spring" as const,
    damping: 25,
    stiffness: 120,
    mass: 0.8
};

const ArtistCard = ({ artwork, onClick }: Props) => {
    const uniqueId = artwork._key || artwork.id;
    const [failed, setFailed] = useState(false);

    const src = failed
        ? artwork.image_url
        : transformedImageUrl(artwork.image_url, { width: 600, quality: 70, resize: 'cover' });

    return (
        <motion.button
            className="artists-card"
            onClick={onClick}
        >
            <div className="artists-card__frame">
                <div className="artists-card__header">
                    <div className="artists-card__title-row">
                        <span className="artists-card__dot" aria-hidden />
                        <motion.span
                            className="artists-card__title"
                            layoutId={`title-${uniqueId}`}
                            transition={transitionSpring}
                        >
                            {artwork.name}
                        </motion.span>
                    </div>
                    <p className="artists-card__artist">
                        {artwork.artist.name}
                    </p>
                </div>
                <div className="artists-card__img-wrap">
                    <motion.img
                        src={src}
                        alt={artwork.name}
                        loading="lazy"
                        onError={() => setFailed(true)}
                        layoutId={`artwork-image-${uniqueId}`}
                        transition={transitionSpring}
                    />
                </div>
            </div>
        </motion.button>
    );
};

export default ArtistCard;